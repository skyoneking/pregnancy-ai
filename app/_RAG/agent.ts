import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { saveCache, loadCache, clearCache as clearFileCache } from "./cache";

// ==================== 配置 ====================
const PDF_PATH = "app/assets/nke-10k-2023.pdf";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

// ==================== 全局变量 ====================
/**
 * 内存缓存：进程级别，重启后丢失
 * - cachedStore: 向量存储实例
 * - initPromise: 防止并发初始化
 */
let cachedStore: MemoryVectorStore | null = null;
let initPromise: Promise<MemoryVectorStore> | null = null;

// ==================== Embeddings ====================
const embeddings = new OpenAIEmbeddings({
  model: process.env.EMBEDDINGS_MODEL ?? "",
  configuration: {
    baseURL: process.env.EMBEDDINGS_BASE_URL ?? "",
    apiKey: process.env.EMBEDDINGS_API_KEY ?? "",
  },
});

// ==================== 核心函数 ====================

/**
 * 使用缓存向量创建 VectorStore（避免重复生成）
 * - 从内存获取向量，不调用 API
 */
async function createVectorStoreFromCache(
  vectors: number[][],
  texts: string[],
  metadatas: Array<Record<string, unknown>>,
): Promise<MemoryVectorStore> {
  // 创建文本→向量的映射
  const textToVector = new Map<string, number[]>();
  texts.forEach((text, i) => textToVector.set(text, vectors[i]));

  // 创建自定义 Embeddings，直接返回缓存的向量
  class CachedEmbeddings extends OpenAIEmbeddings {
    async embedDocuments(documents: string[]): Promise<number[][]> {
      return documents.map((doc) => {
        const vec = textToVector.get(doc);
        if (!vec) {
          throw new Error(`缓存未命中: ${doc.slice(0, 50)}...`);
        }
        return vec;
      });
    }

    async embedQuery(document: string): Promise<number[]> {
      // 查询文本不在缓存中，调用真实的 API 生成 embedding
      return super.embedQuery(document);
    }
  }

  const cachedEmbeddings = new CachedEmbeddings({
    model: process.env.EMBEDDINGS_MODEL ?? "",
    configuration: {
      baseURL: process.env.EMBEDDINGS_BASE_URL ?? "",
      apiKey: process.env.EMBEDDINGS_API_KEY ?? "",
    },
  });

  // 创建并填充 VectorStore
  const docs = texts.map((text, i) => ({
    pageContent: text,
    metadata: metadatas[i],
  }));

  const vectorStore = new MemoryVectorStore(cachedEmbeddings);
  await vectorStore.addDocuments(docs);

  return vectorStore;
}

/**
 * 首次生成 embeddings
 * - 解析 PDF
 * - 生成向量（调用 API）
 * - 保存到文件
 * - 创建 VectorStore
 */
async function generateFromScratch(): Promise<MemoryVectorStore> {
  console.log("🚀 首次初始化，开始生成 embeddings...");
  const startTime = Date.now();

  // 1. 加载文档
  console.log("📄 加载 PDF...");
  const loader = new PDFLoader(PDF_PATH);
  const docs = await loader.load();
  console.log(`   ✓ ${docs.length} 页`);

  // 2. 拆分文档
  console.log("✂️  拆分文档...");
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  const allSplits = await textSplitter.splitDocuments(docs);
  allSplits.splice(50, allSplits.length - 50); // 仅保留前50个 chunk 进行测试
  console.log(`   ✓ ${allSplits.length} 个 chunks`);

  // 3. 生成 embeddings（调用 API，最耗时）
  console.log("🔄 生成 embeddings（调用 API）...");
  const texts = allSplits.map((d) => d.pageContent);
  const vectors = await embeddings.embedDocuments(texts);
  console.log(`   ✓ ${vectors.length} 个向量，维度 ${vectors[0]?.length}`);

  // 4. 保存到文件缓存
  console.log("💾 保存缓存...");
  await saveCache({
    vectors,
    texts,
    metadatas: allSplits.map((d) => d.metadata),
    timestamp: Date.now(),
  });

  // 5. 创建 VectorStore（使用缓存的向量，不重复调用 API）
  console.log("📦 创建向量存储...");
  const vectorStore = await createVectorStoreFromCache(
    vectors,
    texts,
    allSplits.map((d) => d.metadata),
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ 初始化完成，耗时 ${elapsed}s`);

  return vectorStore;
}

/**
 * 获取向量存储（带缓存）
 * - 优先使用内存缓存
 * - 其次使用文件缓存
 * - 最后重新生成
 */
export async function getVectorStore(): Promise<MemoryVectorStore> {
  // 1. 内存缓存命中
  if (cachedStore) {
    console.log("📦 内存缓存命中");
    return cachedStore;
  }

  // 2. 防止并发初始化
  if (initPromise) {
    console.log("⏳ 等待初始化完成...");
    return initPromise;
  }

  // 3. 开始初始化
  initPromise = (async () => {
    // 尝试从文件加载
    const cached = await loadCache();
    if (cached) {
      console.log("💾 文件缓存命中，创建向量存储...");
      cachedStore = await createVectorStoreFromCache(
        cached.vectors,
        cached.texts,
        cached.metadatas,
      );
      return cachedStore;
    }

    // 首次生成
    cachedStore = await generateFromScratch();
    return cachedStore;
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

/**
 * 清除所有缓存
 */
export async function clearCache(): Promise<void> {
  cachedStore = null;
  await clearFileCache();
  console.log("🗑️ 缓存已清除");
}

async function getRetriever(...args: Parameters<MemoryVectorStore["asRetriever"]>) {
  const vectorStore = await getVectorStore();
  return vectorStore.asRetriever(...args);
}

// ==================== 示例运行 ====================

async function run() {
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever(3);

  // return await vectorStore.similaritySearchWithScore(
  //   "When was Nike incorporated?",
  // );
  // return await retriever.batch([
  //   "When was Nike incorporated?",
  //   "What was Nike's revenue in 2023?",
  // ]);
  return await retriever.invoke("When was Nike incorporated?");
}

export { run, getRetriever };

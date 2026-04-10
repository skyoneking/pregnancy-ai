import fs from "fs/promises";
import path from "path";

interface CacheData {
  vectors: number[][];
  texts: string[];
  metadatas: Record<string, unknown>[];
  timestamp: number;
}

const CACHE_DIR = path.join(process.cwd(), "app", "_RAG", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "vectors.json");
const CACHE_TTL = 24 * 60 * 60 * 1000 * 30; // 30 * 24小时

/**
 * 保存向量缓存到文件
 */
export async function saveCache(data: CacheData): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(data));
  console.log(`💾 缓存已保存: ${CACHE_FILE}`);
}

/**
 * 从文件加载向量缓存
 */
export async function loadCache(): Promise<CacheData | null> {
  try {
    const content = await fs.readFile(CACHE_FILE, "utf-8");
    const data = JSON.parse(content) as CacheData;

    // 检查是否过期
    if (Date.now() - data.timestamp > CACHE_TTL) {
      console.log("⏰ 缓存已过期");
      return null;
    }

    console.log(`💾 从缓存加载 (${data.texts.length} chunks)`);
    return data;
  } catch (error) {
    console.log("💾 无可用缓存");
    return null;
  }
}

/**
 * 清除缓存文件
 */
export async function clearCache(): Promise<void> {
  try {
    await fs.unlink(CACHE_FILE);
    console.log("🗑️ 缓存已清除");
  } catch {
    // 文件不存在，忽略
  }
}

/**
 * 创建文本到索引的映射（用于缓存查找）
 */
export function buildTextIndex(texts: string[]): Map<string, number> {
  const index = new Map<string, number>();
  texts.forEach((text, i) => index.set(text, i));
  return index;
}

import {
  StateSchema,
  MessagesValue,
  StateGraph,
  GraphNode,
  START,
  Command,
  END,
  MemorySaver,
  InMemoryStore,
} from "@langchain/langgraph";

import { contextSchema, langchainAgent } from "@/app/_langchain/agent";
import { tool, ToolRuntime } from "langchain";
import z from "zod";
import { getRetriever } from "../_RAG/agent";

const checkpointer = new MemorySaver();
const store = new InMemoryStore();

const stateSchema = new StateSchema({
  messages: MessagesValue,
});

await store.put(
  ["users", "role"], // Namespace to group related data together (users namespace for user data)
  "mom", // Key within the namespace (user ID as key)
  {
    name: "llll",
    language: "English 678",
  }, // Data to store for the given user
);

const retrieve = tool(
  async (
    { query },
    runtime: ToolRuntime<unknown, z.infer<typeof contextSchema>>,
  ) => {
    const userData = await store.get(
      ["users", "role"],
      runtime.context.role ?? "",
    );
    console.log("userData:", userData);
    const retriever = await getRetriever(2);
    const retrievedDocs = await retriever.invoke(query);
    const serialized = retrievedDocs
      .map(
        (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`,
      )
      .join("\n");
    return [serialized, retrievedDocs];
  },
  {
    name: "retrieve",
    description: "检索与用户输入关联的信息。",
    schema: z.object({ query: z.string() }),
    responseFormat: "content_and_artifact",
  },
);

const langchainAgentNode: GraphNode<typeof stateSchema> = async (
  state,
  config,
) => {
  // const res = await retrieve.invoke({ query: "When was Nike incorporated?" });
  // console.log("检索结果:", res);
  await langchainAgent.invoke(state, config as any);
  return new Command({
    goto: END,
  });
};

const graph = new StateGraph(stateSchema)
  .addNode("langchainAgentNode", langchainAgentNode, {
    ends: [END],
  })
  .addEdge(START, "langchainAgentNode")
  .compile({
    checkpointer,
    store,
  });

export { graph, checkpointer, store };

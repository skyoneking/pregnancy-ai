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

import { contextSchema, langchainAgent } from "./agent";

const checkpointer = new MemorySaver();
const store = new InMemoryStore();

const stateSchema = new StateSchema({
  messages: MessagesValue,
});

const langchainAgentNode: GraphNode<typeof stateSchema> = async (
  state,
  config,
) => {
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

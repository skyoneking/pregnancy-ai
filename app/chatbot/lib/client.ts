import { Client } from "@langchain/langgraph-sdk";

const client = new Client({
  apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL || "http://localhost:2024",
});

export { client };

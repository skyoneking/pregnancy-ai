import { run } from "@/app/_RAG/agent";

export async function GET(req: Request) {
  const result = await run();

  return Response.json({ data: result }, { status: 200 });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: "/rag/:path*",
};

export function proxy(request: NextRequest) {
  const newUrl = new URL(
    request.nextUrl.pathname.replace("/rag", ""),
    "http://localhost:3001",
  );
  return NextResponse.rewrite(newUrl);
}

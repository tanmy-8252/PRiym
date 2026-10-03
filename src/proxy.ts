import { NextResponse, type NextRequest } from "next/server";
import { canonicalPageUrl } from "@/lib/canonical-url";

export function proxy(request: NextRequest) {
  const destination = canonicalPageUrl(request.url, request.method);
  return destination
    ? NextResponse.redirect(destination, 307)
    : NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\.[^/]+$).*)"],
};

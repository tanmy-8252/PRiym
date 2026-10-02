import { NextResponse } from "next/server";
import { allowedAuthOrigin } from "@/lib/auth-origin";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { AppError, assert } from "@/lib/errors";
import { requestContext, contextFromRequest } from "./request-context";
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new URL(process.env.AUTH_URL || request.url).origin;
  assert(
    allowedAuthOrigin(origin, allowed),
    403,
    "INVALID_ORIGIN",
    "This request must come from the application.",
  );
}
export async function api<T>(request: Request, fn: () => Promise<T>) {
  try {
    if (!["GET", "HEAD"].includes(request.method)) sameOrigin(request);
    return NextResponse.json(
      { data: await requestContext.run(contextFromRequest(request), fn) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export function errorResponse(e: unknown) {
  const requestId = randomUUID();
  if (e instanceof ZodError)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: e.issues[0]?.message ?? "Check the form values.",
          details: e.flatten(),
          requestId,
        },
      },
      { status: 422 },
    );
  if (e instanceof AppError)
    return NextResponse.json(
      { error: { code: e.code, message: e.message, requestId } },
      { status: e.status },
    );
  if (typeof e === "object" && e && "code" in e && e.code === "P2002")
    return NextResponse.json(
      {
        error: {
          code: "DUPLICATE",
          message: "That record already exists.",
          requestId,
        },
      },
      { status: 409 },
    );
  console.error("PRiym request failed", requestId, e);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
        requestId,
      },
    },
    { status: 500 },
  );
}

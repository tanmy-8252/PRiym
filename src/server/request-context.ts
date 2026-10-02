import { AsyncLocalStorage } from "node:async_hooks";
export const requestContext = new AsyncLocalStorage<{
  ipAddress: string;
  userAgent: string;
}>();
export function contextFromRequest(request: Request) {
  return {
    ipAddress:
      request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim()
        .slice(0, 64) || "",
    userAgent: request.headers.get("user-agent")?.slice(0, 300) || "",
  };
}

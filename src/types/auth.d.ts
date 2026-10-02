import "next-auth";
declare module "next-auth" {
  interface User {
    sessionId?: string;
  }
  interface Session {
    sessionId: string;
  }
}

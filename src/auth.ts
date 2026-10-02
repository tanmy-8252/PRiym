import NextAuth from "next-auth";
import { authRedirect } from "@/lib/auth-origin";
import Credentials from "next-auth/providers/credentials";
import { authenticate } from "@/server/authentication";
import { requestContext, contextFromRequest } from "@/server/request-context";
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 3600 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, otp: {}, remember: {} },
      authorize: (credentials, request) =>
        requestContext.run(contextFromRequest(request), () =>
          authenticate(credentials, request),
        ),
    }),
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      // NextRequest normalizes loopback IPs to localhost. Honor the configured
      // public origin when validating and returning callback URLs.
      return authRedirect(url, process.env.AUTH_URL || baseUrl);
    },
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.sessionId = user.sessionId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId as string;
      session.sessionId = token.sessionId as string;
      return session;
    },
  },
});

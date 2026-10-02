import type { NextConfig } from "next";
const config: NextConfig = {
  turbopack: { root: process.cwd() },
  agentRules: false,
  output: "standalone",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: process.cwd(),
  outputFileTracingExcludes: {
    "/*": [
      "./.env*",
      "./.data/**/*",
      "./docs/**/*",
      "./tests/**/*",
      "./coverage/**/*",
      "./test-results/**/*",
      "./playwright-report/**/*",
    ],
  },
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;

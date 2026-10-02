import nextEnv from "@next/env";
// Match Next.js .env.local / .env.development.local precedence in every CLI.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

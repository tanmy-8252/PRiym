import nextEnv from "@next/env";
// Match Next.js .env.local / .env.development.local precedence in every CLI.
// Production operator commands supply an isolated environment from a private
// file. Never fill their missing values from a local demo installation.
if (process.env.PRIYM_ENV_ISOLATED !== "true")
  nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

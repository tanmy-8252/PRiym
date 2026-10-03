import "./src/lib/env";
import { defineConfig, env } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Runtime uses DATABASE_URL through the pg adapter. Migrations can use the
  // provider's direct connection when its pooled connection restricts DDL.
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || env("DATABASE_URL"),
  },
});

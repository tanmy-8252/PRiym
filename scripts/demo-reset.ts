import "../src/lib/env";
import { assertLocalDemo } from "../src/lib/demo";
import { execFileSync } from "node:child_process";
assertLocalDemo();
for (const args of [["generate"], ["migrate", "deploy"], ["db", "seed"]])
  execFileSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", ...args],
    { stdio: "inherit", env: process.env },
  );
console.log(
  "Demo accounts reset. Existing achievements and points preserved; previous demo sessions revoked.",
);

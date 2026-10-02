import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
function temporary(run: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "priym-env-"));
  try {
    run(dir);
  } finally {
    rmSync(dir, { recursive: true });
  }
}
describe("CLI environment and local secret creation", () => {
  it("loads the same mode-specific local overrides as Next.js", () =>
    temporary((dir) => {
      writeFileSync(
        join(dir, ".env"),
        'DEMO_PASSWORD="BasePass1!"\nDATABASE_URL="postgresql://p:p@127.0.0.1:54329/base"\n',
      );
      writeFileSync(join(dir, ".env.local"), 'DEMO_PASSWORD="LocalPass1!"\n');
      writeFileSync(
        join(dir, ".env.development.local"),
        'DEMO_PASSWORD="DevelopmentPass1!"\nDATABASE_URL="postgresql://p:p@127.0.0.1:54329/override"\n',
      );
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        NODE_ENV: "development",
      };
      delete env.DEMO_PASSWORD;
      delete env.DATABASE_URL;
      delete env.__NEXT_PROCESSED_ENV;
      const script = `import ${JSON.stringify(pathToFileURL(resolve("scripts/load-env.mjs")).href)}; console.log(JSON.stringify({password:process.env.DEMO_PASSWORD,db:process.env.DATABASE_URL}));`;
      const out = execFileSync(
        process.execPath,
        ["--input-type=module", "-e", script],
        { cwd: dir, env, encoding: "utf8" },
      );
      expect(JSON.parse(out)).toEqual({
        password: "DevelopmentPass1!",
        db: "postgresql://p:p@127.0.0.1:54329/override",
      });
    }));
  it("repairs copied placeholders once and preserves valid existing keys", () =>
    temporary((dir) => {
      const fixture =
        'AUTH_SECRET="existing-valid-encryption-key-do-not-rotate"\nAUDIT_SECRET="replace-with-secret"\nDEMO_TOTP_SECRET="replace-with-secret"\n';
      writeFileSync(join(dir, ".env"), fixture);
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        NODE_ENV: "development",
      };
      const script = resolve("scripts/create-env.mjs");
      execFileSync(process.execPath, [script], { cwd: dir, env });
      const first = readFileSync(join(dir, ".env"), "utf8");
      expect(first).toContain(
        'AUTH_SECRET="existing-valid-encryption-key-do-not-rotate"',
      );
      expect(first).not.toContain("replace-with-");
      expect(first).toMatch(/DEMO_TOTP_SECRET="[A-Z2-7]{32}"/);
      execFileSync(process.execPath, [script], { cwd: dir, env });
      expect(readFileSync(join(dir, ".env"), "utf8")).toBe(first);
    }));
});

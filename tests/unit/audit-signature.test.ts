import { describe, it, expect } from "vitest";
import {
  canonicalJson,
  signAudit,
  matchesSignature,
  legacyJsonVariants,
} from "@/lib/audit-signature";
describe("audit signatures", () => {
  it("survives JSONB key reordering including nested metadata", () => {
    const a = { actor: "a", metadata: { z: 1, b: { y: 2, a: 3 } } },
      b = { metadata: { b: { a: 3, y: 2 }, z: 1 }, actor: "a" };
    expect(signAudit(a, "test-key")).toBe(signAudit(b, "test-key"));
  });
  it("detects a changed signed value", () => {
    const signature = signAudit({ points: 75 }, "test-key");
    expect(
      matchesSignature(canonicalJson({ points: 75 }), signature, "test-key"),
    ).toBe(true);
    expect(
      matchesSignature(canonicalJson({ points: 76 }), signature, "test-key"),
    ).toBe(false);
  });
  it("reconstructs small legacy insertion orders", () => {
    expect(legacyJsonVariants({ b: 2, a: 1 })).toContain('{"a":1,"b":2}');
  });
});

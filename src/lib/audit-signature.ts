import { createHmac, timingSafeEqual } from "node:crypto";
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(",")}}`;
}
export function signAudit(payload: unknown, secret: string) {
  return createHmac("sha256", secret)
    .update(canonicalJson(payload))
    .digest("hex");
}
export function matchesSignature(
  payload: string,
  signature: string,
  secret: string,
) {
  const expected = createHmac("sha256", secret).update(payload).digest(),
    actual = Buffer.from(signature, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
// JSONB reorders object keys. Legacy signatures used insertion order; reconstruct
// bounded small-object permutations so old immutable records remain verifiable.
export function legacyJsonVariants(value: unknown, limit = 4096): string[] {
  if (value === null || typeof value !== "object")
    return [JSON.stringify(value)];
  if (Array.isArray(value)) return [JSON.stringify(value)];
  const object = value as Record<string, unknown>,
    keys = Object.keys(object);
  if (keys.length > 6) return [JSON.stringify(value)];
  const orders: string[][] = [];
  const permute = (prefix: string[], remaining: string[]) => {
    if (!remaining.length) {
      orders.push(prefix);
      return;
    }
    for (const key of remaining) {
      if (orders.length >= limit) return;
      permute(
        [...prefix, key],
        remaining.filter((k) => k !== key),
      );
    }
  };
  permute([], keys);
  const variants: string[] = [];
  for (const order of orders) {
    let partial = ["{"];
    for (const [i, key] of order.entries()) {
      const vals = legacyJsonVariants(
        object[key],
        Math.max(1, Math.floor(limit / Math.max(1, orders.length))),
      );
      partial = partial
        .flatMap((prefix) =>
          vals.map(
            (v) => `${prefix}${i ? "," : ""}${JSON.stringify(key)}:${v}`,
          ),
        )
        .slice(0, limit);
    }
    variants.push(...partial.map((p) => `${p}}`));
    if (variants.length >= limit) break;
  }
  return variants.slice(0, limit);
}

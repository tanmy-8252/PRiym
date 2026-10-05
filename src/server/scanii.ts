import { createHash } from "node:crypto";
import { z } from "zod";
import { AppError, assert } from "@/lib/errors";

const regions = {
  us1: "https://api-us1.scanii.com",
  eu1: "https://api-eu1.scanii.com",
  eu2: "https://api-eu2.scanii.com",
  ap1: "https://api-ap1.scanii.com",
  ap2: "https://api-ap2.scanii.com",
  ca1: "https://api-ca1.scanii.com",
} as const;

export function requireScanii() {
  const key = process.env.SCANII_API_KEY?.trim();
  const secret = process.env.SCANII_API_SECRET?.trim();
  const region = process.env.SCANII_REGION?.trim() || "ap2";
  assert(
    key && secret && !key.includes(":") && Object.hasOwn(regions, region),
    503,
    "SCANNER_REQUIRED",
    "Evidence uploads are unavailable until an administrator configures the scanner's API key, secret and region.",
  );
  return {
    key,
    authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
    base: `${regions[region as keyof typeof regions]}/v2.2`,
  };
}

const accountSchema = z.object({
  balance: z.number().finite(),
  keys: z.record(z.string(), z.unknown()),
});
const keySchema = z.object({
  active: z.boolean(),
  detection_categories_enabled: z.array(z.string()),
});
const malwareCategory = (category: string) =>
  category === "MALWARE" || category === "MALWARE_DETECTION";
const knownCategory = (category: string) =>
  malwareCategory(category) ||
  category === "NSFW_LANGUAGE" ||
  category === "NSFW_IMAGE";
const scanSchema = z.object({
  id: z.string().min(1),
  checksum: z.string().regex(/^[a-f0-9]{40}$/i),
  content_length: z.number().int().positive(),
  findings: z.array(z.string().min(1)),
});

async function requestJson(
  url: string,
  authorization: string,
  expectedStatus: number,
  body?: FormData,
) {
  try {
    const response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { Authorization: authorization, Accept: "application/json" },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(body ? 25_000 : 5_000),
    });
    if (response.status !== expectedStatus) {
      const message =
        response.status === 401 || response.status === 403
          ? "The document scanner is not configured correctly. Contact an administrator."
          : response.status === 402 || response.status === 429
            ? "The document scanner has reached its usage limit. Contact an administrator or retry later."
            : response.status === 413
              ? "This file exceeds the scanner plan's size limit. Ask an administrator to check the scanning plan."
              : "The document scanner is temporarily unavailable. Please retry the upload later.";
      throw new AppError(503, "SCANNER_UNAVAILABLE", message);
    }
    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof AppError) throw error;
    // Never forward provider bodies, credentials or account information to clients/logs.
    throw new AppError(
      503,
      "SCANNER_UNAVAILABLE",
      "The document scanner is temporarily unavailable. Please retry the upload later.",
    );
  }
}

async function readAccount() {
  const { key, authorization, base } = requireScanii();
  const account = accountSchema.safeParse(
    await requestJson(`${base}/account.json`, authorization, 200),
  );
  assert(
    account.success,
    503,
    "SCANNER_UNAVAILABLE",
    "The document scanner could not verify its configuration. Please retry later.",
  );
  return { key, authorization, base, account: account.data };
}

export async function scaniiConfigurationStatus() {
  const { key, account } = await readAccount();
  const keyPresent = Object.hasOwn(account.keys, key);
  const configuredKey = keySchema.safeParse(account.keys[key]);
  const categories = configuredKey.success
    ? configuredKey.data.detection_categories_enabled
    : [];
  const active = configuredKey.success && configuredKey.data.active;
  const malwareOnly = categories.length === 1 && malwareCategory(categories[0] ?? "");
  return {
    ready: keyPresent && active && malwareOnly && account.balance > 0,
    keyPresent,
    keyFormatValid: configuredKey.success,
    active,
    malware: categories.some(malwareCategory),
    unsafeLanguage: categories.includes("NSFW_LANGUAGE"),
    unsafeImage: categories.includes("NSFW_IMAGE"),
    otherCategories: categories.filter((category) => !knownCategory(category))
      .length,
    unknownCategoryNames: categories
      .filter((category) => !knownCategory(category))
      .slice(0, 3)
      .map((category) =>
        /^[A-Z][A-Z0-9_]{0,31}$/.test(category) ? category : "[redacted]",
      ),
    hasCredits: account.balance > 0,
  };
}

export async function scanWithScanii(bytes: Buffer, mime: string) {
  // Check each time: a disabled detection engine must never yield a clean upload.
  // The malware-only key also prevents unrelated image/language processing.
  const { key, authorization, base, account } = await readAccount();
  assert(
    Object.hasOwn(account.keys, key),
    503,
    "SCANNER_REQUIRED",
    "The scanner key configured for PRiym does not match a key in the Scanii account. Check the API key and its matching secret in Vercel.",
  );
  const configuredKey = keySchema.safeParse(account.keys[key]);
  assert(
    configuredKey.success,
    503,
    "SCANNER_UNAVAILABLE",
    "Scanii returned key settings in an unexpected format. Contact an administrator.",
  );
  assert(
    configuredKey.data.active,
    503,
    "SCANNER_REQUIRED",
    "The scanner key configured for PRiym is inactive in Scanii. Activate that exact key and save its settings.",
  );
  const categories = configuredKey.data.detection_categories_enabled;
  const malwareOnly = categories.length === 1 && malwareCategory(categories[0] ?? "");
  if (!malwareOnly) {
    // Log only known switch states, never provider data, credentials or file metadata.
    console.warn("PRiym Scanii detection configuration mismatch", {
      malware: categories.some(malwareCategory),
      unsafeLanguage: categories.includes("NSFW_LANGUAGE"),
      unsafeImage: categories.includes("NSFW_IMAGE"),
      otherCategories: categories.filter((category) => !knownCategory(category))
        .length,
    });
  }
  assert(
    malwareOnly,
    503,
    "SCANNER_REQUIRED",
    "The scanner key configured for PRiym must have only Malware detection enabled in Scanii. Save its settings.",
  );
  assert(
    account.balance > 0,
    503,
    "SCANNER_UNAVAILABLE",
    "The document scanner has reached its usage limit. Contact an administrator or retry later.",
  );

  const form = new FormData();
  // No student identifiers, original filename, metadata or storage URL is sent.
  form.append(
    "file",
    new Blob([new Uint8Array(bytes)], { type: mime }),
    "evidence",
  );
  const result = scanSchema.safeParse(
    await requestJson(`${base}/files`, authorization, 201, form),
  );
  assert(
    result.success &&
      result.data.content_length === bytes.length &&
      result.data.checksum.toLowerCase() ===
        createHash("sha1").update(bytes).digest("hex"),
    503,
    "SCANNER_UNAVAILABLE",
    "The document scanner could not verify this file. Please retry later.",
  );
  assert(
    result.data.findings.length === 0,
    422,
    "SCAN_FAILED",
    "This file did not pass the security scan. Choose another document.",
  );
  return "CLEAN" as const;
}

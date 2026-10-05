import { createHash } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { requireScanner, scanEvidence } from "@/server/malware";

const bytes = Buffer.from("%PDF-1.7\nScanii adapter test");
const key = "test-only-scanii-key";
const activeKey = { active: true, detection_categories_enabled: ["MALWARE"] };
const clean = {
  id: "test-result",
  checksum: createHash("sha1").update(bytes).digest("hex"),
  content_length: bytes.length,
  findings: [],
};
const account = { balance: 10, keys: { [key]: activeKey } };
const scan = () =>
  scanEvidence(bytes, "application/pdf", "private-student.pdf");

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("MALWARE_SCANNER", "scanii");
  vi.stubEnv("SCANII_API_KEY", key);
  vi.stubEnv("SCANII_API_SECRET", "test-only-scanii-secret");
  vi.stubEnv("SCANII_REGION", "ap2");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function fetchResults(
  accountResult: unknown = account,
  scanResult: unknown = clean,
) {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json(accountResult))
    .mockResolvedValueOnce(Response.json(scanResult, { status: 201 }));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

it("checks the exact active malware-only key, then accepts completed scans of the same bytes", async () => {
  const fetcher = fetchResults();
  expect(await scan()).toBe("CLEAN");
  const [accountUrl, accountOptions] = fetcher.mock.calls[0];
  expect(accountUrl).toBe("https://api-ap2.scanii.com/v2.2/account.json");
  expect(accountOptions).toMatchObject({
    method: "GET",
    cache: "no-store",
    redirect: "error",
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:test-only-scanii-secret`).toString("base64")}`,
    },
  });
  const [scanUrl, scanOptions] = fetcher.mock.calls[1];
  expect(scanUrl).toBe("https://api-ap2.scanii.com/v2.2/files");
  expect(scanOptions.method).toBe("POST");
  expect(scanOptions.redirect).toBe("error");
  expect(scanOptions.headers.Authorization).toBe(
    accountOptions.headers.Authorization,
  );
  const form = scanOptions.body as FormData;
  const file = form.get("file") as File;
  expect(Array.from(form.keys())).toEqual(["file"]);
  expect(file.name).toBe("evidence");
  expect(file.type).toBe("application/pdf");
  expect(Buffer.from(await file.arrayBuffer())).toEqual(bytes);
});

it.each(["us1", "eu1", "eu2", "ap1", "ap2", "ca1"])(
  "uses only the selected supported region %s",
  async (region) => {
    vi.stubEnv("SCANII_REGION", region);
    const fetcher = fetchResults();
    await scan();
    expect(fetcher.mock.calls[1][0]).toBe(
      `https://api-${region}.scanii.com/v2.2/files`,
    );
  },
);
it("defaults to Singapore when no region is specified", async () => {
  vi.stubEnv("SCANII_REGION", "");
  const fetcher = fetchResults();
  await scan();
  expect(fetcher.mock.calls[0][0]).toBe(
    "https://api-ap2.scanii.com/v2.2/account.json",
  );
});

it.each([
  ["SCANII_API_KEY", ""],
  ["SCANII_API_SECRET", "   "],
  ["SCANII_API_KEY", "user:password"],
  ["SCANII_REGION", "https://example.com"],
  ["SCANII_REGION", "ap2.scanii.com@example.com"],
  ["SCANII_REGION", "__proto__"],
  ["MALWARE_SCANNER", "scani"],
])("blocks invalid %s before any network request", async (variable, value) => {
  vi.stubEnv(variable, value);
  const fetcher = fetchResults();
  expect(requireScanner).toThrow();
  await expect(scan()).rejects.toMatchObject({ code: "SCANNER_REQUIRED" });
  expect(fetcher).not.toHaveBeenCalled();
});

it.each([
  [{ active: false, detection_categories_enabled: ["MALWARE"] }, "inactive", "SCANNER_REQUIRED"],
  [{ active: true, detection_categories_enabled: [] }, "only Malware", "SCANNER_REQUIRED"],
  [{ active: true, detection_categories_enabled: ["NSFW_IMAGE"] }, "only Malware", "SCANNER_REQUIRED"],
  [{ active: true, detection_categories_enabled: ["MALWARE", "NSFW_IMAGE"] }, "only Malware", "SCANNER_REQUIRED"],
  [{ active: "true", detection_categories_enabled: ["MALWARE"] }, "unexpected format", "SCANNER_UNAVAILABLE"],
  [null, "unexpected format", "SCANNER_UNAVAILABLE"],
] as const)(
  "blocks disabled/misconfigured malware detection before sending the file",
  async (configuredKey, message, code) => {
    const fetcher = fetchResults({
      balance: 10,
      keys: { [key]: configuredKey },
    });
    await expect(scan()).rejects.toMatchObject({ code, message: expect.stringContaining(message) });
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);
it("does not use another key's detection configuration", async () => {
  const fetcher = fetchResults({
    balance: 10,
    keys: { anotherKey: activeKey },
  });
  await expect(scan()).rejects.toMatchObject({
    code: "SCANNER_REQUIRED",
    message: expect.stringContaining("does not match a key"),
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("logs only safe switch states when the provider reports extra detection", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  const fetcher = fetchResults({
    balance: 10,
    keys: {
      [key]: {
        active: true,
        detection_categories_enabled: ["MALWARE", "NSFW_LANGUAGE", "private-provider-detail"],
      },
    },
  });
  try {
    await expect(scan()).rejects.toMatchObject({ code: "SCANNER_REQUIRED" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      "PRiym Scanii detection configuration mismatch",
      { malware: true, unsafeLanguage: true, unsafeImage: false, otherCategories: 1 },
    );
    expect(JSON.stringify(warning.mock.calls)).not.toContain(key);
    expect(JSON.stringify(warning.mock.calls)).not.toContain("private-provider-detail");
  } finally {
    warning.mockRestore();
  }
});
it.each([0, -1])(
  "blocks exhausted trial credits before sending the file",
  async (balance) => {
    const fetcher = fetchResults({ ...account, balance });
    await expect(scan()).rejects.toThrow("usage limit");
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);
it.each([{}, null, { balance: "10", keys: {} }])(
  "blocks malformed account configuration",
  async (result) => {
    const fetcher = fetchResults(result);
    await expect(scan()).rejects.toMatchObject({ code: "SCANNER_UNAVAILABLE" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);

it("rejects threats without disclosing findings to the student", async () => {
  fetchResults(account, {
    ...clean,
    findings: ["content.malicious.private-detail"],
  });
  await expect(scan()).rejects.toMatchObject({
    status: 422,
    code: "SCAN_FAILED",
  });
});
it.each([
  {},
  null,
  { id: "pending" },
  { ...clean, checksum: "a".repeat(40) },
  { ...clean, content_length: bytes.length + 1 },
  { ...clean, findings: "clean" },
  { ...clean, findings: [null] },
])(
  "does not mark incomplete, malformed or mismatched analysis clean",
  async (result) => {
    fetchResults(account, result);
    await expect(scan()).rejects.toMatchObject({ code: "SCANNER_UNAVAILABLE" });
  },
);

it.each([401, 403, 402, 413, 429, 503, 202])(
  "blocks HTTP %s and hides upstream errors",
  async (status) => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(account))
      .mockResolvedValueOnce(
        new Response("private-provider-secret", { status }),
      );
    vi.stubGlobal("fetch", fetcher);
    await expect(scan()).rejects.toMatchObject({ code: "SCANNER_UNAVAILABLE" });
    fetcher
      .mockResolvedValueOnce(Response.json(account))
      .mockResolvedValueOnce(
        new Response("private-provider-secret", { status }),
      );
    await expect(scan()).rejects.not.toThrow("private-provider-secret");
  },
);
it("blocks account authentication errors before file transmission", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response("private-account-detail", { status: 401 }));
  vi.stubGlobal("fetch", fetcher);
  await expect(scan()).rejects.toThrow("not configured correctly");
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it.each(["account", "scan"])(
  "blocks network/timeout errors during %s",
  async (phase) => {
    const fetcher = vi.fn();
    if (phase === "scan") fetcher.mockResolvedValueOnce(Response.json(account));
    fetcher.mockRejectedValueOnce(new Error("private-credential-detail"));
    vi.stubGlobal("fetch", fetcher);
    await expect(scan()).rejects.toThrow("temporarily unavailable");
  },
);
it.each(["account", "scan"])(
  "blocks non-JSON responses during %s",
  async (phase) => {
    const fetcher = vi.fn();
    if (phase === "scan") fetcher.mockResolvedValueOnce(Response.json(account));
    fetcher.mockResolvedValueOnce(
      new Response("upstream html", { status: phase === "scan" ? 201 : 200 }),
    );
    vi.stubGlobal("fetch", fetcher);
    await expect(scan()).rejects.toMatchObject({ code: "SCANNER_UNAVAILABLE" });
  },
);

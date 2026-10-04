import { afterEach, expect, it, vi } from "vitest";
import { uploadEvidenceFile } from "@/lib/evidence-upload";
const ok = (data: unknown) => Response.json({ data });
afterEach(() => {
  vi.unstubAllGlobals();
});

it("uses a signed direct transfer and small finalize request for a 6 MB PDF", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      ok({
        transport: "direct",
        id: "upload-id",
        uploadUrl: "https://storage.example/signed",
      }),
    )
    .mockResolvedValueOnce(Response.json({ Key: "quarantine/file" }))
    .mockResolvedValueOnce(ok({ id: "evidence-id", fileName: "large.pdf" }));
  vi.stubGlobal("fetch", fetcher);
  const file = new File(
    ["%PDF-", new Uint8Array(6 * 1024 * 1024)],
    "large.pdf",
    { type: "application/pdf" },
  );
  expect(await uploadEvidenceFile(file)).toEqual({
    id: "evidence-id",
    fileName: "large.pdf",
  });
  expect(fetcher.mock.calls[0][0]).toBe("/api/v1/evidence/uploads");
  expect(fetcher.mock.calls[1][0]).toBe("https://storage.example/signed");
  const transfer = fetcher.mock.calls[1][1];
  expect(transfer.credentials).toBe("omit");
  expect(transfer.headers).toEqual({ "x-upsert": "false" });
  expect((transfer.body as FormData).get("")).toBeInstanceOf(File);
  expect(fetcher.mock.calls[2][1].body).toBe("{}");
});
it("supports local uploads and a browser that omits the PDF MIME type", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(ok({ transport: "server" }))
    .mockResolvedValueOnce(ok({ id: "evidence", fileName: "proof.pdf" }));
  vi.stubGlobal("fetch", fetcher);
  await uploadEvidenceFile(new File(["%PDF-1.7"], "proof.pdf"));
  expect(JSON.parse(fetcher.mock.calls[0][1].body).mimeType).toBe(
    "application/pdf",
  );
  expect(fetcher.mock.calls[1][1].headers["Content-Type"]).toBe(
    "application/pdf",
  );
});
it.each([
  new File(["abc"], "document.exe"),
  new File([], "empty.pdf", { type: "application/pdf" }),
  new File([new Uint8Array(10 * 1024 * 1024 + 1)], "huge.pdf", {
    type: "application/pdf",
  }),
])("rejects invalid selection before starting any upload", async (file) => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(uploadEvidenceFile(file)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it("preserves scanner errors and never returns an attachment for a failed scan", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      ok({
        transport: "direct",
        id: "upload",
        uploadUrl: "https://storage.example/signed",
      }),
    )
    .mockResolvedValueOnce(new Response("{}"))
    .mockResolvedValueOnce(
      Response.json(
        { error: { message: "The scanner is unavailable." } },
        { status: 503 },
      ),
    );
  vi.stubGlobal("fetch", fetcher);
  await expect(
    uploadEvidenceFile(
      new File(["%PDF-1.7"], "proof.pdf", { type: "application/pdf" }),
    ),
  ).rejects.toThrow("The scanner is unavailable.");
});
it("handles non-JSON service failures without a JSON parsing error", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(new Response("Request too large", { status: 413 })),
  );
  await expect(
    uploadEvidenceFile(
      new File(["%PDF-1.7"], "proof.pdf", { type: "application/pdf" }),
    ),
  ).rejects.toThrow("too large");
});
it("does not finalize a failed storage transfer", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      ok({
        transport: "direct",
        id: "upload",
        uploadUrl: "https://storage.example/signed",
      }),
    )
    .mockResolvedValueOnce(new Response("denied", { status: 403 }));
  vi.stubGlobal("fetch", fetcher);
  await expect(
    uploadEvidenceFile(
      new File(["%PDF-1.7"], "proof.pdf", { type: "application/pdf" }),
    ),
  ).rejects.toThrow("could not reach storage");
  expect(fetcher).toHaveBeenCalledTimes(2);
});

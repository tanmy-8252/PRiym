import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
async function pdf(name: string) {
  const document = await PDFDocument.create();
  document.addPage().drawText("Synthetic PRiym upload test");
  return {
    name,
    mimeType: "application/pdf",
    buffer: Buffer.from(await document.save()),
  };
}
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Institutional email").fill("student@atria.edu");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.DEMO_PASSWORD || "PriymDemo1!");
  await page.getByRole("button", { name: "Sign in →", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page
    .getByRole("link", { name: "Add achievement", exact: false })
    .first()
    .click();
});
test("keeps successful PDF attachments, preserves scanner errors, and retries the same selected file", async ({
  page,
}) => {
  const submit = page.getByRole("button", {
    name: "Submit for review",
    exact: false,
  });
  await expect(submit).toBeDisabled();
  let fail = true;
  await page.route("**/api/v1/evidence/uploads", async (route) => {
    const metadata = route.request().postDataJSON();
    if (metadata.fileName === "retry.pdf" && fail) {
      fail = false;
      await route.fulfill({
        status: 503,
        json: {
          error: {
            code: "SCANNER_UNAVAILABLE",
            message: "The scanner is temporarily unavailable.",
          },
        },
      });
    } else await route.continue();
  });
  await page
    .getByLabel("Upload supporting evidence")
    .setInputFiles([await pdf("first.pdf"), await pdf("retry.pdf")]);
  await expect(
    page.getByText("first.pdf · Uploaded", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("retry.pdf — Upload failed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("The scanner is temporarily unavailable.", { exact: true }),
  ).toBeVisible();
  await expect(submit).toBeDisabled();
  await page
    .getByRole("button", { name: "Retry failed uploads", exact: true })
    .click();
  await expect(
    page.getByText("retry.pdf · Uploaded", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("first.pdf · Uploaded", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("2 of 5 files uploaded and ready to attach.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".notice.error[role=alert]")).toHaveCount(0);
  await expect(submit).toBeEnabled();
});
test("a failed selected file can be removed or selected again without a missing-evidence submission", async ({
  page,
}) => {
  await page.route("**/api/v1/evidence/uploads", (route) =>
    route.fulfill({
      status: 503,
      json: { error: { message: "Scanner setup is incomplete." } },
    }),
  );
  const file = await pdf("unavailable.pdf");
  const input = page.getByLabel("Upload supporting evidence");
  await input.setInputFiles(file);
  await expect(
    page.getByText("unavailable.pdf — Upload failed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit for review", exact: false }),
  ).toBeDisabled();
  await page
    .getByRole("button", {
      name: "Remove failed upload unavailable.pdf",
      exact: true,
    })
    .click();
  await expect(page.locator(".notice.error[role=alert]")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Submit for review", exact: false }),
  ).toBeDisabled();
  await input.setInputFiles(file);
  await expect(
    page.getByText("unavailable.pdf — Upload failed", { exact: true }),
  ).toBeVisible();
});
test("uploads a real JPG and shows its completed attachment", async ({
  page,
}) => {
  const jpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCfAB//2Q==",
    "base64",
  );
  await page
    .getByLabel("Upload supporting evidence")
    .setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await expect(
    page.getByText("photo.jpg · Uploaded", { exact: true }),
  ).toBeVisible();
});

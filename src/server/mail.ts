import { db } from "@/lib/db";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@/generated/prisma/client";
export function queueMail(
  tx: Prisma.TransactionClient,
  recipient: string,
  subject: string,
  body: string,
  dedupKey?: string,
) {
  const data = { recipient, subject, body, dedupKey };
  return dedupKey
    ? tx.mailOutbox.upsert({ where: { dedupKey }, create: data, update: {} })
    : tx.mailOutbox.create({ data });
}
export async function deliverMail() {
  let sent = 0,
    failed = 0;
  await db.$transaction(
    async (tx) => {
      const locks = await tx.$queryRaw<
        { locked: boolean }[]
      >`SELECT pg_try_advisory_xact_lock(913824) AS locked`;
      if (!locks[0]?.locked) return;
      const messages = await tx.mailOutbox.findMany({
        where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
        orderBy: { createdAt: "asc" },
        take: 20,
      });
      for (const m of messages) {
        try {
          const provider = process.env.EMAIL_PROVIDER || "file";
          if (provider === "file" && process.env.NODE_ENV !== "production") {
            const dir = path.resolve(
              /* turbopackIgnore: true */ process.cwd(),
              process.env.MAIL_DIR || ".data/mail",
            );
            await mkdir(dir, { recursive: true, mode: 0o700 });
            await writeFile(
              path.join(/* turbopackIgnore: true */ dir, `${m.id}.json`),
              JSON.stringify(
                { to: m.recipient, subject: m.subject, text: m.body },
                null,
                2,
              ),
              { mode: 0o600 },
            );
          } else {
            if (
              provider !== "resend" ||
              !process.env.RESEND_API_KEY ||
              !process.env.EMAIL_FROM
            )
              throw new Error("Email provider is not configured");
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
                "Idempotency-Key": m.id,
              },
              body: JSON.stringify({
                from: process.env.EMAIL_FROM,
                to: [m.recipient],
                subject: m.subject,
                text: m.body,
              }),
              signal: AbortSignal.timeout(5000),
            });
            if (!response.ok)
              throw new Error(`Email service returned ${response.status}`);
          }
          await tx.mailOutbox.update({
            where: { id: m.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              attempts: { increment: 1 },
              lastError: null,
            },
          });
          sent++;
        } catch (e) {
          await tx.mailOutbox.update({
            where: { id: m.id },
            data: {
              status: m.attempts >= 4 ? "FAILED" : "PENDING",
              attempts: { increment: 1 },
              nextAttemptAt: new Date(
                Date.now() + 2 ** (m.attempts + 1) * 60_000,
              ),
              lastError: (e as Error).message.slice(0, 200),
            },
          });
          failed++;
        }
      }
    },
    { timeout: 120000 },
  );
  return { sent, failed };
}
export async function queueNotificationEmail() {
  return db.$transaction(async (tx) => {
    const pending = await tx.notification.findMany({
      where: { emailedAt: null },
      include: { user: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    for (const n of pending) {
      if (
        !n.user.emailPreferences.some((event) =>
          n.title.toLowerCase().startsWith(event.toLowerCase()),
        ) &&
        !n.user.emailPreferences.includes("ALL")
      )
        await queueMail(
          tx,
          n.user.email,
          n.title,
          `${n.body}\n\n${process.env.AUTH_URL}${n.link || "/notifications"}`,
          `notification:${n.id}`,
        );
      await tx.notification.update({
        where: { id: n.id },
        data: { emailedAt: new Date() },
      });
    }
    return pending.length;
  });
}

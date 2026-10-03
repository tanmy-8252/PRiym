import { db } from "@/lib/db";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@/generated/prisma/client";
import { mailConfiguration } from "@/lib/mail-config";
import { sendSmtp } from "./smtp";
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
export async function deliverMail(messageIds?: readonly string[]) {
  let sent = 0,
    failed = 0;
  if (messageIds && !messageIds.length) return { sent, failed };
  const config = mailConfiguration();
  const messages = await db.mailOutbox.findMany({
    where: {
      status: "PENDING",
      nextAttemptAt: { lte: new Date() },
      ...(messageIds ? { id: { in: [...messageIds] } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: config?.provider === "smtp" ? 5 : 20,
  });
  for (const pending of messages)
    await db.$transaction(
      async (tx) => {
        // Lock each message independently so a busy worker cannot skip a new
        // verification email. A second invocation rechecks status after locking.
        const locks = await tx.$queryRaw<
          { locked: boolean }[]
        >`SELECT pg_try_advisory_xact_lock(hashtext(${`mail:${pending.id}`})) AS locked`;
        if (!locks[0]?.locked) return;
        const m = await tx.mailOutbox.findUnique({
          where: { id: pending.id },
        });
        if (!m || m.status !== "PENDING" || m.nextAttemptAt > new Date())
          return;
        try {
          if (!config) throw new Error("Email provider is not configured");
          if (config.provider === "file") {
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
          } else if (config.provider === "smtp") {
            await sendSmtp(config, m);
          } else {
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${config.apiKey}`,
                "Content-Type": "application/json",
                "Idempotency-Key": m.id,
              },
              body: JSON.stringify({
                from: config.from,
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
      },
      { timeout: 20000 },
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

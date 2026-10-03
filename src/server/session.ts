import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AppError, assert } from "@/lib/errors";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id || !session.sessionId) return null;
  const record = await db.authSession.findUnique({
    where: { id: session.sessionId },
    include: { user: { include: { department: true } } },
  });
  if (
    !record ||
    record.userId !== session.user.id ||
    record.revokedAt ||
    record.expiresAt < new Date() ||
    record.lastSeenAt < new Date(Date.now() - 30 * 60_000) ||
    record.user.status !== "ACTIVE" ||
    record.user.removedAt
  )
    return null;
  if (Date.now() - record.lastSeenAt.getTime() > 60_000)
    await db.authSession.update({
      where: { id: record.id },
      data: { lastSeenAt: new Date() },
    });
  return { ...record.user, sessionId: record.id };
}
export async function requireUser(roles?: Role[]) {
  const user = await currentUser();
  assert(user, 401, "UNAUTHENTICATED", "Please sign in again.");
  if (roles)
    assert(
      roles.includes(user.role),
      403,
      "FORBIDDEN",
      "Your role does not have access to this action.",
    );
  return user;
}
export async function pageUser(roles?: Role[]) {
  try {
    return await requireUser(roles);
  } catch (e) {
    if (e instanceof AppError && e.status === 401) redirect("/login");
    if (e instanceof AppError && e.status === 403) redirect("/dashboard");
    throw e;
  }
}

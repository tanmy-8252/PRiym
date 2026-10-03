import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { authenticator } from "otplib";
import { db } from "@/lib/db";
import {
  register,
  consumeAccountToken,
  manageMfa,
  issueToken,
} from "@/server/account";
import { authenticate } from "@/server/authentication";
import { configure } from "@/server/configuration";
import { updateUser } from "@/server/admin";
import {
  saveSubmission,
  reviewSubmission,
  evaluateBadges,
} from "@/server/submissions";
import {
  buildReport,
  queueReport,
  runReportJobs,
  downloadReport,
} from "@/server/report-jobs";
import { deliverMail, queueMail } from "@/server/mail";
import type { User } from "@/generated/prisma/client";
import { encrypt } from "@/lib/crypto";
let admin: User,
  student: User,
  faculty: User,
  departmentId: string,
  categoryId: string,
  semesterId: string;
const suffix = randomUUID().slice(0, 8),
  password = "StrongPass1!";
beforeAll(async () => {
  const dept = await db.department.create({
    data: { code: `C${suffix}`, name: "Completion test department" },
  });
  departmentId = dept.id;
  const passwordHash = await hash(password, 4);
  admin = await db.user.create({
    data: {
      email: `admin-${suffix}@atria.edu`,
      name: "Completion Admin",
      departmentId,
      role: "ADMIN",
      passwordHash,
      status: "ACTIVE",
      emailVerified: true,
    },
  });
  faculty = await db.user.create({
    data: {
      email: `faculty-${suffix}@atria.edu`,
      name: "Completion Faculty",
      departmentId,
      role: "FACULTY",
      passwordHash,
      status: "ACTIVE",
      emailVerified: true,
    },
  });
  student = await db.user.create({
    data: {
      email: `student-${suffix}@atria.edu`,
      name: "Completion Student",
      departmentId,
      role: "STUDENT",
      passwordHash,
      status: "ACTIVE",
      emailVerified: true,
      usn: `C${suffix}`,
      mentorId: faculty.id,
    },
  });
  await db.department.update({
    where: { id: departmentId },
    data: { defaultVerifierId: faculty.id },
  });
  categoryId = (
    await db.category.create({
      data: {
        name: `Completion ${suffix}`,
        description: "Test category",
        basePoints: 50,
        checklist: ["Evidence checked"],
        departmentId,
      },
    })
  ).id;
  let semester = await db.semester.findFirst({ where: { active: true } });
  if (!semester) {
    const year = new Date().getUTCFullYear();
    semester = await db.semester.create({
      data: {
        label: `Test active ${suffix}`,
        academicYear: String(year),
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        active: true,
      },
    });
  }
  semesterId = semester.id;
});
afterAll(async () => db.$disconnect());
afterEach(() => vi.unstubAllEnvs());
async function token(userId: string, purpose: string) {
  const m = await db.mailOutbox.findFirst({
    where: {
      recipient: (await db.user.findUniqueOrThrow({ where: { id: userId } }))
        .email,
      subject:
        purpose === "VERIFY"
          ? "Verify your PRiym email"
          : "Reset your PRiym password",
    },
    orderBy: { createdAt: "desc" },
  });
  return m!.body.match(/token=([a-f0-9]{64})/)![1];
}
async function submit() {
  const e = await db.evidence.create({
    data: {
      ownerId: student.id,
      fileName: "proof.pdf",
      mimeType: "application/pdf",
      sizeBytes: 10,
      sha256: "a".repeat(64),
      storageKey: `${student.id}/${randomUUID()}`,
      scanStatus: "CLEAN",
    },
  });
  return saveSubmission(student, {
    title: `Completion award ${randomUUID().slice(0, 8)}`,
    description: "This is a verified achievement with sufficient detail.",
    organization: "Atria Institute",
    achievementDate: new Date().toISOString().slice(0, 10),
    categoryId,
    level: "NATIONAL",
    evidenceIds: [e.id],
  });
}
describe("completed account and administration paths", () => {
  it("requires email verification before approval and consumes links once", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_URL", "https://priym.example.com");
    vi.stubEnv("EMAIL_PROVIDER", "smtp");
    vi.stubEnv("EMAIL_FROM", "synthetic@gmail.com");
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_USER", "synthetic@gmail.com");
    vi.stubEnv("SMTP_PASSWORD", "synthetic-only-no-external-email");
    await db.user.update({
      where: { id: admin.id },
      data: {
        mfaSecret: encrypt(authenticator.generateSecret()),
      },
    });
    const email = `registered-${suffix}@atria.edu`;
    const scheduleMail = vi.fn();
    await register(
      {
        name: "Registered Student",
        email,
        password,
        departmentId,
        role: "STUDENT",
        usn: `1AT26CS${Math.floor(Math.random() * 900 + 100)}`,
      },
      scheduleMail,
    );
    const mail = await db.mailOutbox.findFirstOrThrow({
      where: { recipient: email },
    });
    expect(scheduleMail).toHaveBeenCalledExactlyOnceWith([mail.id]);
    expect(mail.body).toContain(
      "https://priym.example.com/account?mode=verify",
    );
    // Callback is scheduled only after the account and mail transaction commits.
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.status).toBe("PENDING");
    expect(await authenticate({ email, password })).toBeNull();
    await expect(
      updateUser(admin, user.id, { status: "ACTIVE" }),
    ).rejects.toMatchObject({ code: "EMAIL_UNVERIFIED" });
    const raw = await token(user.id, "VERIFY");
    await consumeAccountToken({ token: raw, purpose: "VERIFY" });
    await expect(
      consumeAccountToken({ token: raw, purpose: "VERIFY" }),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
    await updateUser(admin, user.id, { status: "ACTIVE" });
    expect(await authenticate({ email, password })).not.toBeNull();
  });
  it("does not create accounts or schedule emails with incomplete production setup", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_PROVIDER", "file");
    const email = `blocked-${suffix}@atria.edu`;
    const scheduleMail = vi.fn();
    await expect(
      register(
        {
          name: "Blocked Student",
          email,
          password,
          departmentId,
          role: "STUDENT",
          usn: "1AT26CS999",
        },
        scheduleMail,
      ),
    ).rejects.toMatchObject({ code: "REGISTRATION_UNAVAILABLE" });
    expect(await db.user.findUnique({ where: { email } })).toBeNull();
    expect(await db.mailOutbox.count({ where: { recipient: email } })).toBe(0);
    expect(scheduleMail).not.toHaveBeenCalled();
  });
  it("reset tokens reject reuse and revoke sessions", async () => {
    const session = await authenticate({ email: student.email, password });
    expect(session).not.toBeNull();
    await db.$transaction((tx) => issueToken(tx, student, "RESET"));
    const raw = await token(student.id, "RESET");
    await expect(
      consumeAccountToken({ token: raw, purpose: "RESET", password }),
    ).rejects.toMatchObject({ code: "PASSWORD_REUSE" });
    await consumeAccountToken({
      token: raw,
      purpose: "RESET",
      password: "NewStrongPass2!",
    });
    expect(
      (
        await db.authSession.findUniqueOrThrow({
          where: { id: session!.sessionId },
        })
      ).revokedAt,
    ).not.toBeNull();
    await expect(
      consumeAccountToken({
        token: raw,
        purpose: "RESET",
        password: "OtherStrong3!",
      }),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
    student = await db.user.findUniqueOrThrow({ where: { id: student.id } });
  });
  it("enrolls MFA and consumes recovery codes exactly once", async () => {
    const setup = await manageMfa(faculty, { action: "BEGIN", password });
    expect(setup.secret).toBeTruthy();
    const codes = await manageMfa(faculty, {
      action: "CONFIRM",
      password,
      otp: authenticator.generate(setup.secret!),
    });
    expect(codes.recoveryCodes).toHaveLength(8);
    expect(
      await authenticate({
        email: faculty.email,
        password,
        otp: codes.recoveryCodes![0],
      }),
    ).not.toBeNull();
    expect(
      await authenticate({
        email: faculty.email,
        password,
        otp: codes.recoveryCodes![0],
      }),
    ).toBeNull();
  });
  it("blocks conflicted decisions and allows Admin reassignment", async () => {
    const s = await submit();
    await configure(admin, {
      action: "CONFLICT",
      facultyId: faculty.id,
      studentId: student.id,
      reason: "Personal relationship requires an independent reviewer.",
    });
    await expect(
      reviewSubmission(faculty, s.id, {
        action: "APPROVE",
        version: 0,
        checklist: ["Evidence checked"],
      }),
    ).rejects.toMatchObject({ code: "CONFLICT_OF_INTEREST" });
    const other = await db.user.create({
      data: {
        name: "Independent Faculty",
        email: `independent-${suffix}@atria.edu`,
        departmentId,
        role: "FACULTY",
        passwordHash: faculty.passwordHash,
        status: "ACTIVE",
        emailVerified: true,
      },
    });
    await configure(admin, {
      action: "REASSIGN",
      id: s.id,
      facultyId: other.id,
      reason: "Independent review to resolve declared conflict.",
    });
    await reviewSubmission(other, s.id, {
      action: "APPROVE",
      version: 1,
      checklist: ["Evidence checked"],
    });
    expect(
      (await db.submission.findUniqueOrThrow({ where: { id: s.id } }))
        .pointsAwarded,
    ).toBe(75);
  });
  it("evaluates category/activity badges permanently", async () => {
    const b = await db.badge.create({
      data: {
        name: `Activity ${suffix}`,
        description: "An approved achievement in this category",
        threshold: 1,
        ruleType: "ACTIVITY",
        categoryId,
      },
    });
    await db.$transaction((tx) => evaluateBadges(tx, student.id, admin));
    expect(
      await db.userBadge.findUnique({
        where: { userId_badgeId: { userId: student.id, badgeId: b.id } },
      }),
    ).not.toBeNull();
    await db.userBadge.update({
      where: { userId_badgeId: { userId: student.id, badgeId: b.id } },
      data: { revokedAt: new Date() },
    });
    await db.$transaction((tx) => evaluateBadges(tx, student.id, admin));
    expect(
      (
        await db.userBadge.findUniqueOrThrow({
          where: { userId_badgeId: { userId: student.id, badgeId: b.id } },
        })
      ).revokedAt,
    ).not.toBeNull();
  });
  it("exports genuine summary/faculty data and prevents student-wide reports", async () => {
    const summary = await buildReport(admin, {
      type: "summary",
      format: "csv",
      status: "all",
    });
    expect(summary.bytes.toString()).toContain("Total submissions");
    const facultyReport = await buildReport(admin, {
      type: "faculty",
      format: "xlsx",
      status: "all",
    });
    expect(facultyReport.bytes.subarray(0, 2).toString()).toBe("PK");
    await expect(
      buildReport(student, { type: "summary", format: "csv", status: "all" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("generates background reports with authorized expiring downloads", async () => {
    const job = await queueReport(student, "type=achievements&format=pdf");
    await runReportJobs();
    const report = await downloadReport(student, job.id);
    expect(report.bytes.subarray(0, 5).toString()).toBe("%PDF-");
    await expect(downloadReport(faculty, job.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    const changed = await db.user.update({
      where: { id: student.id },
      data: { role: "FACULTY" },
    });
    await expect(downloadReport(changed, job.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await db.user.update({
      where: { id: student.id },
      data: { role: "STUDENT" },
    });
    await db.reportJob.update({
      where: { id: job.id },
      data: { expiresAt: new Date(0) },
    });
    await expect(downloadReport(student, job.id)).rejects.toMatchObject({
      code: "EXPIRED",
    });
  });
  it("archives semester honor rolls and rejects overlapping semesters", async () => {
    await expect(
      configure(admin, {
        action: "SEMESTER",
        label: "Overlap",
        academicYear: "2026",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "2090-12-31",
      }),
    ).rejects.toMatchObject({ code: "OVERLAP" });
    await configure(admin, { action: "CLOSE_SEMESTER", id: semesterId });
    expect(
      await db.honorRoll.count({ where: { semesterId, userId: student.id } }),
    ).toBe(1);
    await expect(
      configure(admin, { action: "CLOSE_SEMESTER", id: semesterId }),
    ).rejects.toMatchObject({ code: "CLOSED" });
  });
  it("delivers local email through an idempotent private outbox", async () => {
    await db.$transaction((tx) =>
      queueMail(
        tx,
        student.email,
        "Outbox test",
        "A development-only message",
        `test:${suffix}`,
      ),
    );
    const first = await deliverMail();
    expect(first.sent).toBeGreaterThan(0);
    await deliverMail();
    expect(
      await db.mailOutbox.count({
        where: { dedupKey: `test:${suffix}`, status: "SENT" },
      }),
    ).toBe(1);
  });
  it("targets only the committed account emails and prevents duplicate delivery", async () => {
    const [target, unrelated] = await db.$transaction(async (tx) => [
      await queueMail(tx, student.email, "Targeted email", "Synthetic message"),
      await queueMail(
        tx,
        student.email,
        "Unrelated queued email",
        "Synthetic message",
      ),
    ]);
    expect(await deliverMail([])).toEqual({ sent: 0, failed: 0 });
    const results = await Promise.all([
      deliverMail([target.id]),
      deliverMail([target.id]),
    ]);
    expect(results.reduce((n, r) => n + r.sent, 0)).toBe(1);
    expect(
      (await db.mailOutbox.findUniqueOrThrow({ where: { id: target.id } }))
        .status,
    ).toBe("SENT");
    expect(
      (await db.mailOutbox.findUniqueOrThrow({ where: { id: unrelated.id } }))
        .status,
    ).toBe("PENDING");
  });
});

import "../src/lib/env";
import { db } from "../src/lib/db";
import { resetDemoAccounts } from "../src/server/demo-accounts";
import { assertLocalDemo } from "../src/lib/demo";
import { saveSubmission, reviewSubmission } from "../src/server/submissions";
import { storeEvidence } from "../src/server/storage";
import { PDFDocument, StandardFonts } from "pdf-lib";
async function main() {
  assertLocalDemo();
  const { dept } = await resetDemoAccounts();
  const now = new Date(),
    year = now.getUTCFullYear(),
    half = now.getUTCMonth() < 6 ? 0 : 6;
  const start = new Date(Date.UTC(year, half, 1)),
    end = new Date(Date.UTC(year, half + 6, 0)),
    prevStart = new Date(Date.UTC(year, half - 6, 1)),
    prevEnd = new Date(Date.UTC(year, half, 0));
  if ((await db.semester.count()) === 0)
    await db.semester.createMany({
      data: [
        {
          label: `${half === 0 ? "Even" : "Odd"} semester ${year}`,
          startDate: start,
          endDate: end,
          active: true,
        },
        { label: "Previous semester", startDate: prevStart, endDate: prevEnd },
      ],
    });
  const faculty = await db.user.findUniqueOrThrow({
    where: { email: "faculty@atria.edu" },
  });
  await db.department.update({
    where: { id: dept.id },
    data: { defaultVerifierId: faculty.id },
  });
  await db.user.updateMany({
    where: { role: "STUDENT", departmentId: dept.id, mentorId: null },
    data: { mentorId: faculty.id },
  });
  for (const [name, basePoints, description, requiresPosition] of [
    ["Hackathons", 100, "Build, compete and solve real problems.", true],
    [
      "Research",
      200,
      "Papers, publications and research contributions.",
      false,
    ],
    ["Certifications", 50, "Recognized technical certifications.", false],
    [
      "Internships",
      150,
      "Industry experience and professional practice.",
      false,
    ],
    [
      "Community",
      30,
      "Volunteering, mentoring and community leadership.",
      false,
    ],
    ["Sports & Culture", 40, "Sporting and cultural accomplishments.", true],
  ] as const)
    await db.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        basePoints,
        description,
        requiresPosition,
        departmentId: dept.id,
        checklist: [
          "Evidence is authentic and readable",
          "Student identity and achievement date match",
          "Category, level and result are accurate",
        ],
      },
    });
  for (const [name, threshold] of [
    ["First Steps", 25],
    ["Silver Merit", 500],
    ["Gold Merit", 1000],
  ] as const)
    await db.badge.upsert({
      where: { name },
      update: {},
      create: {
        name,
        threshold,
        description: `Earn ${threshold} verified achievement points.`,
      },
    });
  const samples = [
    [
      "student@atria.edu",
      "Smart India Hackathon finalist",
      "Hackathons",
      "NATIONAL",
      "APPROVE",
    ],
    [
      "student@atria.edu",
      "Cloud fundamentals certification",
      "Certifications",
      "NATIONAL",
      "APPROVE",
    ],
    [
      "student@atria.edu",
      "Campus innovation challenge",
      "Hackathons",
      "COLLEGE",
      "PENDING",
    ],
    [
      "student2@atria.edu",
      "Student research publication",
      "Research",
      "INTERNATIONAL",
      "APPROVE",
    ],
    [
      "student2@atria.edu",
      "Software engineering internship",
      "Internships",
      "NATIONAL",
      "PENDING",
    ],
    [
      "student3@atria.edu",
      "Open source mentoring program",
      "Community",
      "NATIONAL",
      "APPROVE",
    ],
    [
      "student3@atria.edu",
      "Department coding sprint",
      "Hackathons",
      "DEPARTMENT",
      "PENDING",
    ],
  ] as const;
  for (const [email, title, categoryName, level, decision] of samples) {
    const student = await db.user.findUniqueOrThrow({ where: { email } });
    if (
      await db.submission.findFirst({ where: { studentId: student.id, title } })
    )
      continue;
    const cat = await db.category.findUniqueOrThrow({
      where: { name: categoryName },
    });
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText("PRiym demo evidence", { x: 50, y: 780, size: 22, font });
    page.drawText(title, { x: 50, y: 730, size: 13, font });
    page.drawText(
      "Synthetic document for local testing. Not a real certificate.",
      { x: 50, y: 690, size: 11, font },
    );
    const stored = await storeEvidence(
      student.id,
      Buffer.from(await pdf.save()),
      "application/pdf",
      "demo-certificate.pdf",
    );
    const evidence = await db.evidence.create({
      data: { ownerId: student.id, ...stored },
    });
    const saved = await saveSubmission(student, {
      title,
      categoryId: cat.id,
      level,
      description:
        "This is a synthetic achievement included to demonstrate the complete PRiym review workflow.",
      organization: "Atria Institute of Technology",
      position: "Finalist",
      achievementDate: now.toISOString().slice(0, 10),
      evidenceIds: [evidence.id],
    });
    if (decision === "APPROVE")
      await reviewSubmission(faculty, saved.id, {
        action: "APPROVE",
        version: 0,
        checklist: cat.checklist,
        comment: "Demo evidence reviewed.",
      });
  }
  console.log(
    "Seed ready. Demo accounts: student / faculty / hod / admin @atria.edu.",
  );
}
main().finally(() => db.$disconnect());

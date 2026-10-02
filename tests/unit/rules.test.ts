import { describe, it, expect } from "vitest";
import {
  institutionDate,
  businessDeadline,
  calculatePoints,
  canReadSubmission,
  canReview,
  titleSimilarity,
} from "@/lib/rules";
it("uses the Indian calendar date across the UTC midnight boundary", () => {
  expect(institutionDate(new Date("2026-09-30T19:00:00Z"))).toBe("2026-10-01");
});
import {
  submissionSchema,
  reviewSchema,
  passwordSchema,
} from "@/lib/validation";
describe("PRD points formula", () => {
  it.each([
    ["INTERNATIONAL", 200],
    ["NATIONAL", 150],
    ["STATE", 120],
    ["UNIVERSITY", 100],
    ["COLLEGE", 80],
    ["DEPARTMENT", 50],
  ] as const)("applies %s level", (level, points) =>
    expect(calculatePoints(100, level, 1)).toBe(points),
  );
  it("applies department weights and rounds fractional points", () =>
    expect(calculatePoints(51, "NATIONAL", 1.2)).toBe(92));
});
it("skips weekends for review deadlines", () =>
  expect(
    businessDeadline(new Date("2026-09-25T10:00:00Z"), 5).toISOString(),
  ).toBe("2026-10-02T10:00:00.000Z"));
it("warns for near-duplicate titles", () => {
  expect(
    titleSimilarity("Smart India Hackathon", "Smart India Hackathons"),
  ).toBeGreaterThan(0.85);
  expect(
    titleSimilarity("Cloud certification", "Hackathon winner"),
  ).toBeLessThan(0.85);
  expect(titleSimilarity("abc", "abc")).toBe(1);
});
describe("department and reviewer boundaries", () => {
  const s = {
    studentId: "student",
    reviewerId: "faculty",
    departmentId: "cse",
    escalated: false,
    student: { mentorId: "mentor" },
  };
  it("allows owners, mentors, assigned faculty and HOD to read", () => {
    for (const [id, role] of [
      ["student", "STUDENT"],
      ["faculty", "FACULTY"],
      ["mentor", "FACULTY"],
      ["hod", "HOD"],
    ])
      expect(canReadSubmission({ id, role, departmentId: "cse" }, s)).toBe(
        true,
      );
  });
  it("blocks unrelated students, faculty and other departments", () => {
    expect(
      canReadSubmission(
        { id: "other", role: "STUDENT", departmentId: "cse" },
        s,
      ),
    ).toBe(false);
    expect(
      canReadSubmission(
        { id: "other", role: "FACULTY", departmentId: "cse" },
        s,
      ),
    ).toBe(false);
    expect(
      canReadSubmission({ id: "hod", role: "HOD", departmentId: "ece" }, s),
    ).toBe(false);
  });
  it("restricts decisions to assigned faculty and escalated HOD", () => {
    expect(
      canReview({ id: "faculty", role: "FACULTY", departmentId: "cse" }, s),
    ).toBe(true);
    expect(
      canReview({ id: "mentor", role: "FACULTY", departmentId: "cse" }, s),
    ).toBe(false);
    expect(canReview({ id: "hod", role: "HOD", departmentId: "cse" }, s)).toBe(
      false,
    );
    expect(
      canReview(
        { id: "hod", role: "HOD", departmentId: "cse" },
        { ...s, escalated: true },
      ),
    ).toBe(true);
    expect(
      canReview(
        { id: "faculty", role: "FACULTY", departmentId: "cse" },
        { ...s, escalated: true },
      ),
    ).toBe(false);
  });
});
describe("input validation", () => {
  const data = {
    title: "Verified certification",
    description: "A detailed description of a technical achievement.",
    organization: "Atria Institute",
    categoryId: "11111111-1111-4111-8111-111111111111",
    level: "NATIONAL",
    achievementDate: "2026-01-01",
    evidenceIds: [],
  };
  it("requires evidence for final submissions but allows a draft", () => {
    expect(submissionSchema.safeParse(data).success).toBe(false);
    expect(submissionSchema.safeParse({ ...data, draft: true }).success).toBe(
      true,
    );
  });
  it("rejects future dates, invalid titles, insecure links and too many attachments", () => {
    for (const d of [
      { achievementDate: "2099-01-01" },
      { title: "Bad <script> title" },
      { externalUrl: "http://example.com" },
      { evidenceIds: Array(6).fill(data.categoryId) },
    ])
      expect(
        submissionSchema.safeParse({
          ...data,
          evidenceIds: [data.categoryId],
          ...d,
        }).success,
      ).toBe(false);
  });
  it("requires rejection reasons, clarification details and escalation context", () => {
    expect(
      reviewSchema.safeParse({
        action: "REJECT",
        version: 0,
        comment: "Something wrong",
      }).success,
    ).toBe(false);
    expect(
      reviewSchema.safeParse({ action: "CLARIFY", version: 0, comment: "Hi" })
        .success,
    ).toBe(false);
    expect(
      reviewSchema.safeParse({
        action: "ESCALATE",
        version: 0,
        comment: "Short reason",
      }).success,
    ).toBe(false);
    expect(
      reviewSchema.safeParse({ action: "APPROVE", version: 0 }).success,
    ).toBe(true);
  });
  it("validates passwords", () => {
    expect(passwordSchema.safeParse("PriymDemo1!").success).toBe(true);
    expect(passwordSchema.safeParse("password").success).toBe(false);
  });
});

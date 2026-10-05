import { z } from "zod";
import { LEVELS, institutionDate } from "./rules";
export const semesterDateSchema = z.iso.date().refine(
  (value) => {
    const year = Number(value.slice(0, 4));
    return year >= 2000 && year <= 2100;
  },
  "Enter a four-digit year between 2000 and 2100 (YYYY-MM-DD).",
);
export const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^a-zA-Z0-9]/)
  .refine(
    (p) => new TextEncoder().encode(p).length <= 72,
    "Use a shorter password.",
  );
export const submissionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5)
      .max(150)
      .regex(
        /^[\p{L}\p{N}\s(),\-.:]+$/u,
        "Use letters, numbers, spaces or (),-.: in the title.",
      ),
    description: z.string().trim().min(20).max(1000),
    organization: z.string().trim().min(3).max(200),
    categoryId: z.string().uuid(),
    level: z.enum(LEVELS),
    achievementDate: z.iso
      .date()
      .refine(
        (d) => d <= institutionDate(),
        "Achievement date cannot be in the future.",
      ),
    position: z.string().max(100).optional(),
    externalUrl: z
      .union([z.literal(""), z.url().startsWith("https://")])
      .optional(),
    subcategory: z.string().max(80).optional(),
    collaboratorIds: z.array(z.string().uuid()).max(20).default([]),
    evidenceIds: z.array(z.string().uuid()).max(5),
    draft: z.boolean().default(false),
    confirmDuplicate: z.boolean().default(false),
  })
  .refine((d) => d.draft || d.evidenceIds.length > 0, {
    path: ["evidenceIds"],
    message: "Upload at least one evidence document.",
  });
export const reviewSchema = z
  .object({
    action: z.enum([
      "APPROVE",
      "REJECT",
      "CLARIFY",
      "ESCALATE",
      "START",
      "RETURN",
      "REASSIGN",
    ]),
    comment: z.string().trim().max(2000).default(""),
    reasonCode: z.string().max(80).optional(),
    checklist: z.array(z.string()).max(20).default([]),
    reviewerId: z.string().uuid().optional(),
    version: z.number().int().nonnegative(),
  })
  .superRefine((d, ctx) => {
    if (
      ["REJECT", "CLARIFY", "RETURN", "REASSIGN"].includes(d.action) &&
      d.comment.length < 10
    )
      ctx.addIssue({
        code: "custom",
        path: ["comment"],
        message: "Please provide a specific comment of at least 10 characters.",
      });
    if (d.action === "ESCALATE" && d.comment.length < 50)
      ctx.addIssue({
        code: "custom",
        path: ["comment"],
        message: "Escalation needs at least 50 characters of context.",
      });
    if (d.action === "REJECT" && !d.reasonCode)
      ctx.addIssue({
        code: "custom",
        path: ["reasonCode"],
        message: "Select a rejection reason.",
      });
    if (d.action === "REASSIGN" && !d.reviewerId)
      ctx.addIssue({
        code: "custom",
        path: ["reviewerId"],
        message: "Choose a faculty reviewer.",
      });
  });
export const userSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[\p{L} .]+$/u),
    email: z.email().toLowerCase(),
    password: passwordSchema,
    departmentId: z.string().uuid(),
    role: z.enum(["STUDENT", "FACULTY", "HOD", "ADMIN"]),
    usn: z
      .string()
      .regex(/^1AT\d{2}[A-Z]{2}\d{3}$/)
      .optional(),
    batchYear: z.number().int().min(2000).max(2100).optional(),
  })
  .refine((d) => d.role !== "STUDENT" || !!d.usn, {
    path: ["usn"],
    message: "A student needs a valid USN, such as 1AT22CS001.",
  });
export const categorySchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().max(500),
  basePoints: z.number().int().min(1).max(1000),
  multiplier: z.number().min(0.1).max(5),
  checklist: z.array(z.string().trim().min(3).max(200)).min(1).max(20),
  requiresPosition: z.boolean().default(false),
  active: z.boolean().default(true),
  subcategories: z.array(z.string().trim().min(2).max(80)).max(30).default([]),
  programOutcomes: z
    .array(z.string().trim().min(2).max(100))
    .max(20)
    .default([]),
  naacIndicator: z.string().trim().max(200).default(""),
  rejectionCodes: z.array(z.string().trim().min(3).max(80)).max(30).default([]),
});

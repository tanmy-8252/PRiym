export const LEVELS = [
  "INTERNATIONAL",
  "NATIONAL",
  "STATE",
  "UNIVERSITY",
  "COLLEGE",
  "DEPARTMENT",
] as const;
export function institutionDate(value: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}
export const MULTIPLIERS = {
  INTERNATIONAL: 2,
  NATIONAL: 1.5,
  STATE: 1.2,
  UNIVERSITY: 1,
  COLLEGE: 0.8,
  DEPARTMENT: 0.5,
};
export const OPEN_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "RESUBMITTED",
] as const;
export function calculatePoints(
  base: number,
  level: keyof typeof MULTIPLIERS,
  weight: number,
) {
  return Math.round(base * MULTIPLIERS[level] * weight);
}
export function businessDeadline(start: Date, days: number) {
  const result = new Date(start);
  for (let i = 0; i < days;) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (![0, 6].includes(result.getUTCDay())) i++;
  }
  return result;
}
export function titleSimilarity(a: string, b: string) {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = old;
    }
  }
  return 1 - row[b.length] / Math.max(a.length, b.length, 1);
}
export function canReadSubmission(
  user: { id: string; role: string; departmentId: string },
  s: {
    studentId: string;
    reviewerId: string | null;
    departmentId: string;
    student?: { mentorId: string | null };
  },
) {
  if (user.role === "ADMIN") return true;
  if (user.departmentId !== s.departmentId) return false;
  if (user.role === "HOD") return true;
  if (user.role === "STUDENT") return user.id === s.studentId;
  return (
    user.role === "FACULTY" &&
    (user.id === s.reviewerId || user.id === s.student?.mentorId)
  );
}
export function canReview(
  user: { id: string; role: string; departmentId: string },
  s: {
    studentId: string;
    reviewerId: string | null;
    departmentId: string;
    escalated: boolean;
  },
) {
  if (user.id === s.studentId || user.departmentId !== s.departmentId)
    return false;
  return (
    (user.role === "FACULTY" && user.id === s.reviewerId && !s.escalated) ||
    (user.role === "HOD" && s.escalated)
  );
}

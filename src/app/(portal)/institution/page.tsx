import { db } from "@/lib/db";
import { pageUser } from "@/server/session";
import { Heading, Card, date } from "@/components/ui";
import {
  InstitutionForm,
  BulkImport,
  BadgeControls,
} from "@/components/institution-controls";
export default async function Institution() {
  await pageUser(["ADMIN"]);
  const [
    departments,
    semesters,
    conflicts,
    faculty,
    students,
    badges,
    categories,
  ] = await Promise.all([
    db.department.findMany(),
    db.semester.findMany({ orderBy: { startDate: "desc" } }),
    db.conflictOfInterest.findMany(),
    db.user.findMany({
      where: { role: "FACULTY", status: "ACTIVE" },
      select: { id: true, name: true },
    }),
    db.user.findMany({
      where: { role: "STUDENT", removedAt: null },
      select: { id: true, name: true },
    }),
    db.badge.findMany(),
    db.category.findMany({ select: { id: true, name: true } }),
  ]);
  return (
    <>
      <Heading
        title="Institution controls."
        description="Academic periods, routing, impartial reviews and recognition."
      />
      <div className="stack">
        <Card title="Departments">
          <InstitutionForm
            action="DEPARTMENT"
            button="Create department"
            fields={[
              { name: "name", label: "Name" },
              { name: "code", label: "Code" },
            ]}
          />
          {departments.map((d) => (
            <details key={d.id} style={{ marginTop: 20 }}>
              <summary>
                {d.code} · {d.name}
              </summary>
              <p className="tiny muted">Department ID for import: {d.id}</p>
              <InstitutionForm
                action="DEPARTMENT"
                id={d.id}
                button="Save department"
                fields={[
                  { name: "name", label: "Name", value: d.name },
                  { name: "code", label: "Code", value: d.code },
                  {
                    name: "defaultVerifierId",
                    label: "Default verifier",
                    value: d.defaultVerifierId || "",
                    required: false,
                    options: [{ id: "", name: "No default" }, ...faculty],
                  },
                ]}
              />
            </details>
          ))}
        </Card>
        <Card title="Academic years & semesters">
          <InstitutionForm
            action="SEMESTER"
            button="Create semester"
            fields={[
              { name: "label", label: "Semester label" },
              { name: "academicYear", label: "Academic year (e.g. 2026–2027)" },
              { name: "startDate", label: "Starts", type: "iso-date" },
              { name: "endDate", label: "Ends", type: "iso-date" },
              {
                name: "active",
                label: "Make active",
                type: "checkbox",
                required: false,
              },
            ]}
          />
          {semesters.map((s) => (
            <details key={s.id} style={{ marginTop: 20 }}>
              <summary>
                {s.label} ·{" "}
                {s.active ? "Active" : s.closedAt ? "Archived" : "Inactive"} ·{" "}
                {date(s.startDate)}–{date(s.endDate)}
              </summary>
              {!s.closedAt && (
                <>
                  <InstitutionForm
                    action="SEMESTER"
                    id={s.id}
                    button="Update semester"
                    fields={[
                      { name: "label", label: "Label", value: s.label },
                      {
                        name: "academicYear",
                        label: "Academic year",
                        value:
                          s.academicYear ||
                          String(s.startDate.getUTCFullYear()),
                      },
                      {
                        name: "startDate",
                        label: "Starts",
                        type: "iso-date",
                        value: s.startDate.toISOString().slice(0, 10),
                      },
                      {
                        name: "endDate",
                        label: "Ends",
                        type: "iso-date",
                        value: s.endDate.toISOString().slice(0, 10),
                      },
                      {
                        name: "active",
                        label: "Make active",
                        type: "checkbox",
                        value: s.active,
                        required: false,
                      },
                    ]}
                  />
                  <p className="small muted">
                    Closing is permanent and records the top ten students for
                    each department.
                  </p>
                  <InstitutionForm
                    action="CLOSE_SEMESTER"
                    id={s.id}
                    fields={[]}
                    button="Close & archive honor roll"
                  />
                </>
              )}
            </details>
          ))}
        </Card>
        <Card title="Bulk account import">
          <BulkImport />
          <a
            download
            className="btn ghost"
            href="/api/v1/admin/users?format=csv"
          >
            Export accounts as CSV
          </a>
        </Card>
        <Card title="Conflict-of-interest registry">
          <InstitutionForm
            action="CONFLICT"
            button="Register conflict"
            fields={[
              { name: "facultyId", label: "Faculty", options: faculty },
              { name: "studentId", label: "Student", options: students },
              { name: "reason", label: "Reason (20+ characters)" },
            ]}
          />
          {conflicts.map((c) => (
            <details key={c.id} style={{ marginTop: 15 }}>
              <summary>
                {faculty.find((f) => f.id === c.facultyId)?.name} /{" "}
                {students.find((s) => s.id === c.studentId)?.name ??
                  "Removed account"}
              </summary>
              <p>{c.reason}</p>
              <InstitutionForm
                action="REMOVE_CONFLICT"
                id={c.id}
                button="Remove conflict"
                fields={[
                  { name: "reason", label: "Removal reason (20+ characters)" },
                ]}
              />
            </details>
          ))}
        </Card>
        <Card title="Recognition rules">
          <BadgeControls
            badges={badges}
            students={students}
            categories={categories}
          />
        </Card>
      </div>
    </>
  );
}

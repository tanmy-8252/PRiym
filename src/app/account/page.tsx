import { db } from "@/lib/db";
import { Logo } from "@/components/ui";
import { AccountForm } from "@/components/account-form";
export const dynamic = "force-dynamic";
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; token?: string }>;
}) {
  const q = await searchParams,
    mode = ["register", "verify", "reset"].includes(q.mode || "")
      ? q.mode!
      : "reset";
  const departments =
    mode === "register"
      ? await db.department.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];
  return (
    <main style={{ maxWidth: 540, margin: "40px auto", padding: 24 }}>
      <Logo />
      <section className="card" style={{ marginTop: 30 }}>
        <h1>
          {mode === "register"
            ? "Join PRiym."
            : mode === "verify"
              ? "Verify your email."
              : "Reset your password."}
        </h1>
        <p className="small muted" style={{ margin: "15px 0" }}>
          Use your institutional account. Email verification and approval
          protect your department’s records.
        </p>
        <AccountForm mode={mode} token={q.token} departments={departments} />
      </section>
    </main>
  );
}

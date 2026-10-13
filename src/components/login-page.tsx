import Link from "next/link";
import { Logo } from "@/components/ui";
import { LoginForm } from "@/components/login-form";
import { localDemoEnabled } from "@/lib/demo";

export type LoginAudience = "STUDENT" | "FACULTY" | "HOD" | "ADMIN";

const workspaces = [
  { label: "Student", href: "/student/login", audience: "STUDENT" },
  { label: "Faculty", href: "/faculty/login", audience: "FACULTY" },
  { label: "HOD", href: "/login?role=hod", audience: "HOD" },
  { label: "Admin", href: "/login?role=admin", audience: "ADMIN" },
] as const;

export function LoginPage({ audience }: { audience?: LoginAudience }) {
  const title =
    audience === "STUDENT"
      ? "Student sign in"
      : audience === "FACULTY"
        ? "Faculty sign in"
        : audience === "HOD"
          ? "HOD sign in"
          : audience === "ADMIN"
            ? "Admin sign in"
            : "Choose your account category.";
  return (
    <div className="login">
      <section className="login-brand">
        <Logo />
        <div>
          <div className="eyebrow" style={{ color: "#a3c7ad" }}>
            Atria Institute of Technology
          </div>
          <h1>
            Every effort.
            <br />
            Every milestone.
            <br />
            <span style={{ color: "#b1cca0" }}>Every achievement.</span>
          </h1>
          <p>
            Your progress deserves to be seen. Record what you accomplish, get
            it verified, and build a portfolio that tells your story.
          </p>
        </div>
        <footer className="small" style={{ color: "#91b49c" }}>
          Progress · Recognition · Innovation · Merit
        </footer>
      </section>
      <section className="login-form">
        <div className="login-form-inner">
          <div className="eyebrow">Welcome to PRiym</div>
          <h1>{title}</h1>
          <p className="muted">
            {audience
              ? "Enter your account details to sign in."
              : "Select Student, Faculty, HOD or Admin to continue."}
          </p>
          <nav className="login-roles" aria-label="Choose login workspace">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.audience}
                href={workspace.href}
                prefetch={false}
                aria-current={
                  audience === workspace.audience ? "page" : undefined
                }
              >
                {workspace.label}
              </Link>
            ))}
          </nav>
          {audience && (
            <LoginForm
              key={audience}
              audience={audience}
              demoPassword={
                localDemoEnabled() &&
                process.env.NEXT_PUBLIC_DEMO_MODE === "true"
                  ? process.env.DEMO_PASSWORD
                  : undefined
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}

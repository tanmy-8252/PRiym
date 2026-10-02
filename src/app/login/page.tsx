import { Logo } from "@/components/ui";
import { LoginForm } from "@/components/login-form";
import { localDemoEnabled } from "@/lib/demo";
export const dynamic = "force-dynamic";
export default function Login() {
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
          <h1>Good to see you.</h1>
          <p className="muted">Sign in with your institutional account.</p>
          <LoginForm
            demoPassword={
              localDemoEnabled() && process.env.NEXT_PUBLIC_DEMO_MODE === "true"
                ? process.env.DEMO_PASSWORD
                : undefined
            }
          />
        </div>
      </section>
    </div>
  );
}

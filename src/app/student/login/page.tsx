import { LoginPage } from "@/components/login-page";

export const dynamic = "force-dynamic";

export default function StudentLogin() {
  return <LoginPage audience="STUDENT" />;
}

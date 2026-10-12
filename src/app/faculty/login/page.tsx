import { LoginPage } from "@/components/login-page";

export const dynamic = "force-dynamic";

export default function FacultyLogin() {
  return <LoginPage audience="FACULTY" />;
}

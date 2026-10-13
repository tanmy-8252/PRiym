import { LoginPage } from "@/components/login-page";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const role = (await searchParams).role?.toLowerCase();
  const audience =
    role === "hod" ? "HOD" : role === "admin" ? "ADMIN" : undefined;
  return <LoginPage audience={audience} />;
}

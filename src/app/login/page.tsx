import { LoginPage } from "@/components/login-page";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const value = (await searchParams).role;
  const role = typeof value === "string" ? value.toLowerCase() : undefined;
  const audience =
    role === "hod" ? "HOD" : role === "admin" ? "ADMIN" : undefined;
  return <LoginPage audience={audience} />;
}

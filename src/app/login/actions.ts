"use server";

import { signIn } from "@/auth";
import { redirect } from "next/navigation";

export type LoginState = { error: string };

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const role = formData.get("role")?.toString();
  if (!role || !["STUDENT", "FACULTY", "HOD", "ADMIN"].includes(role)) {
    return { error: "Select an account category to sign in." };
  }
  let destination: string;
  try {
    destination = await signIn("credentials", {
      role,
      email: formData.get("email")?.toString() ?? "",
      password: formData.get("password")?.toString() ?? "",
      otp: formData.get("otp")?.toString() ?? "",
      remember: formData.has("remember") ? "true" : "false",
      redirect: false,
      redirectTo: "/dashboard",
    });
  } catch {
    return { error: "Sign-in is temporarily unavailable. Try again." };
  }

  if (new URL(destination, process.env.AUTH_URL).searchParams.has("error")) {
    return {
      error: ["HOD", "ADMIN"].includes(role)
        ? "Unable to sign in. Check your credentials and authenticator code, account approval, or wait 30 minutes if locked."
        : "Unable to sign in. Check your credentials, account approval, or wait 30 minutes if locked. If you enabled an authenticator, enter its code.",
    };
  }
  redirect("/dashboard");
}

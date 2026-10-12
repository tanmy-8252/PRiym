"use server";

import { signIn } from "@/auth";
import { redirect } from "next/navigation";

export type LoginState = { error: string };

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  let destination: string;
  try {
    destination = await signIn("credentials", {
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
      error:
        "Unable to sign in. Check your credentials and MFA code, account approval, or wait 30 minutes if locked.",
    };
  }
  redirect("/dashboard");
}

import { z } from "zod";

type Environment = Record<string, string | undefined>;
export type MailConfiguration =
  | { provider: "file" }
  | { provider: "resend"; from: string; apiKey: string }
  | {
      provider: "smtp";
      from: string;
      host: string;
      port: number;
      user: string;
      password: string;
    };

// Return configuration only; never include secret values in diagnostics.
export function mailConfiguration(
  env: Environment = process.env,
): MailConfiguration | null {
  const provider = env.EMAIL_PROVIDER || "file";
  if (provider === "file")
    return env.NODE_ENV === "production" ? null : { provider };
  const from = z.email().safeParse(env.EMAIL_FROM);
  if (!from.success) return null;
  if (provider === "resend" && env.RESEND_API_KEY?.trim())
    return { provider, from: from.data, apiKey: env.RESEND_API_KEY };
  if (provider !== "smtp") return null;
  const settings = z
    .object({
      host: z
        .string()
        .regex(/^[a-zA-Z0-9.-]+$/)
        .min(1),
      port: z.coerce.number().refine((n) => n === 465 || n === 587),
      user: z.email(),
      password: z.string().min(1),
    })
    .safeParse({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
    });
  if (!settings.success) return null;
  // Gmail sends as the authenticated account. Do not advertise another sender.
  if (
    settings.data.host.toLowerCase() === "smtp.gmail.com" &&
    from.data.toLowerCase() !== settings.data.user.toLowerCase()
  )
    return null;
  return { provider, from: from.data, ...settings.data };
}

import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: {
    default: "PRiym · Every achievement counts",
    template: "%s · PRiym",
  },
  description:
    "Progress, Recognition, Innovation and Merit. Achievement management at Atria Institute of Technology.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

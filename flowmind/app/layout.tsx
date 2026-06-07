import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowMind — Turn messy processes into clear SOPs",
  description:
    "Describe any process in plain English. AI turns it into a structured, shareable runbook in seconds.",
  icons: {
    icon: "/favicon.ico", 
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

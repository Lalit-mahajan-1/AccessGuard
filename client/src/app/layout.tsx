import type { Metadata } from "next";
import { ClientToaster } from "@/components/ClientToaster";
import Providers from "@/lib/providers";
import "./globals.css"; // Make sure your Tailwind CSS is imported here

export const metadata: Metadata = {
  title: "AccessGuard | Web Auditor",
  description: "Automated Web Performance, SEO & Accessibility Auditing Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <ClientToaster />
        </Providers>
      </body>
    </html>
  );
}

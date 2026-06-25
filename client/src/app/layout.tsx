import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/lib/providers";
import "./globals.css"; // Make sure your Tailwind CSS is imported here

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <Providers>
          {children}
          {/* Premium Toast Notifications */}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
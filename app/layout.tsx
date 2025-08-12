import "./globals.css";
import { ClerkProvider } from "@/lib/auth/client";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "shipshow.io — Show your work. Get hired.",
  description:
    "Dead-simple one-page portfolio for tinkerers, PMs, and builders. 5 projects free. $9/month for unlimited + custom domain.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "shipshow.io — Show your work. Get hired.",
    description: "One page per user. 5 projects free. Upgrade for unlimited + custom domain.",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "shipshow.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "shipshow.io — Show your work. Get hired.",
    description: "One page per user. 5 projects free. Upgrade for unlimited + custom domain.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-dvh bg-white text-gray-900">
          {children}
          <footer className="border-t mt-24">
            <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-gray-500 flex items-center justify-between">
                <p>© {new Date().getFullYear()} shipshow.io</p>
              <div className="flex gap-6">
                <Link href="/sign-in">Sign in</Link>
                <Link href="/sign-up">Get started</Link>
              </div>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}

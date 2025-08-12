"use client";

 import { UserButton, useAuth, SignOutControl } from "@/lib/auth/client";
import Link from "next/link";

export default function Nav() {
  const { isSignedIn } = useAuth();
  return (
    <header className="sticky top-0 bg-white/70 backdrop-blur border-b z-40">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          shipshow.io
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="text-sm">Dashboard</Link>
              <SignOutControl redirectUrl="/" />
            </>
          ) : (
            <Link href="/sign-in" className="text-sm rounded-md border px-3 py-1.5 hover:bg-gray-50">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

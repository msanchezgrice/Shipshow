"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/client";

export default function Pricing() {
  const { isSignedIn } = useAuth();
  const freeHref = isSignedIn ? "/dashboard" : "/sign-up";
  const proHref = isSignedIn ? "/billing" : "/sign-up";
  return (
    <section id="pricing" className="py-24 border-t">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Simple pricing</h2>
          <p className="text-gray-600 mt-2">Start free. Upgrade if you need more.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="text-gray-600 mt-1">Perfect for testing the waters.</p>
            <div className="text-4xl font-bold mt-4">$0</div>
            <ul className="mt-6 text-sm space-y-2">
              <li>• One public page</li>
              <li>• Up to 5 projects</li>
              <li>• Shareable link: your-handle.projectproof.io</li>
            </ul>
            <Link href={freeHref} className="inline-block mt-6 rounded-md border px-4 py-2 hover:bg-gray-50">Get started</Link>
          </div>
          <div className="rounded-xl border p-6 ring-1 ring-indigo-200">
            <h3 className="text-xl font-semibold">Unlimited</h3>
            <p className="text-gray-600 mt-1">For active job seekers and builders.</p>
            <div className="text-4xl font-bold mt-4">$9<span className="text-lg font-medium text-gray-500">/mo</span></div>
            <ul className="mt-6 text-sm space-y-2">
              <li>• Unlimited projects</li>
              <li>• Custom domain support</li>
              <li>• Priority rendering</li>
            </ul>
            <Link href={proHref} className="inline-block mt-6 rounded-md bg-black text-white px-4 py-2 hover:opacity-90">Upgrade</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

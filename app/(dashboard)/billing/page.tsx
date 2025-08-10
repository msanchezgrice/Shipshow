"use client";

import { useEffect, useState } from "react";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Could not start checkout.");
        setLoading(false);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setLoading(false);
    }
  }

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Could not open billing portal.");
        setLoading(false);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <p className="text-gray-600 mt-1">Upgrade to Unlimited for $9/month. Cancel anytime.</p>
      <div className="mt-6 flex gap-4">
        <button onClick={startCheckout} disabled={loading}
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50">Start checkout</button>
        <button onClick={openPortal} disabled={loading}
          className="rounded-md border px-4 py-2 disabled:opacity-50">Open billing portal</button>
      </div>
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </main>
  );
}

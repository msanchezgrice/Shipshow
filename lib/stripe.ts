// Simple Stripe mock facade for local development.
// If NEXT_PUBLIC_USE_MOCKS=0, import and use real Stripe code.

const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? (process.env.NODE_ENV === "production" ? "0" : "1")) !== "0";

export function isMockingStripe() {
  return USE_MOCKS;
}

export async function createCheckoutSession(): Promise<{ url?: string; error?: string }> {
  if (!USE_MOCKS) return { error: "Not in mock mode" };
  return { url: "/billing?mockCheckout=1" };
}

export async function createBillingPortal(): Promise<{ url?: string; error?: string }> {
  if (!USE_MOCKS) return { error: "Not in mock mode" };
  return { url: "/billing?mockPortal=1" };
}



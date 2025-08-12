import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockingStripe } from "@/lib/stripe";

let stripe: any = null;
if (!isMockingStripe()) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Stripe = require("stripe");
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const price = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
  if (!price && !isMockingStripe()) return NextResponse.json({ error: "Missing price id" }, { status: 500 });

  let sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    sub = await prisma.subscription.create({ data: { userId, status: "free" } });
  }

  let customerId = sub.stripeCustomerId || undefined;

  if (!customerId && !isMockingStripe()) {
    const customer = await stripe.customers.create({ metadata: { userId } });
    customerId = customer.id;
    await prisma.subscription.update({ where: { userId }, data: { stripeCustomerId: customerId } });
  }

  if (isMockingStripe()) {
    // Optimistically set to active for local UX
    await prisma.subscription.update({ where: { userId }, data: { status: "active" } });
    return NextResponse.json({ url: `/dashboard?upgraded=1` });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    billing_address_collection: "auto",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}

import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockingStripe } from "@/lib/stripe";

let stripe: any = null;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (isMockingStripe()) {
    return NextResponse.json({ url: `/dashboard` });
  }
  if (!sub?.stripeCustomerId) return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: portal.url });
}

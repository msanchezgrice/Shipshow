import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string | undefined;
        const subscriptionId = session.subscription as string | undefined;

        if (customerId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = (await stripe.customers.retrieve(customerId) as Stripe.Customer).metadata?.userId;
          if (userId) {
            await prisma.subscription.upsert({
              where: { userId },
              create: {
                userId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                status: sub.status === "active" ? "active" : "past_due",
                priceId: sub.items.data[0]?.price?.id,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
              },
              update: {
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                status: sub.status === "active" ? "active" : "past_due",
                priceId: sub.items.data[0]?.price?.id,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
              },
            });
          }
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const cust = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userId = cust.metadata?.userId;
        if (userId) {
          await prisma.subscription.update({
            where: { userId },
            data: {
              stripeSubscriptionId: subscription.id,
              status: subscription.status === "active" ? "active" :
                      subscription.status === "past_due" ? "past_due" :
                      subscription.status === "canceled" ? "canceled" : "canceled",
              priceId: subscription.items.data[0]?.price?.id,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (e: any) {
    // log any handler errors to help debugging
    console.error("Stripe webhook error:", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

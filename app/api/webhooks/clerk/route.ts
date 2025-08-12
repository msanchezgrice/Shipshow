import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;
    
    // Get primary email
    const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
    
    try {
      // Upsert user in database
      await prisma.user.upsert({
        where: { id },
        create: {
          id,
          handle: username || id, // Use username as handle or fallback to id
          name: `${first_name || ""} ${last_name || ""}`.trim() || null,
          avatarUrl: image_url || null,
        },
        update: {
          handle: username || undefined,
          name: `${first_name || ""} ${last_name || ""}`.trim() || null,
          avatarUrl: image_url || null,
        },
      });

      // Create default subscription record if it doesn't exist
      await prisma.subscription.upsert({
        where: { userId: id },
        create: {
          id: `sub_${id}`,
          userId: id,
          status: "free",
        },
        update: {}, // Don't update if exists
      });

      console.log(`User ${id} synced successfully`);
    } catch (error) {
      console.error("Error syncing user to database:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    
    try {
      // Delete user and related data (cascade delete will handle related records)
      await prisma.user.delete({
        where: { id },
      });
      
      console.log(`User ${id} deleted successfully`);
    } catch (error) {
      console.error("Error deleting user from database:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}

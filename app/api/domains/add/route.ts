import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPaid } from "@/lib/subscription";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const paid = await isPaid(userId);
  if (!paid) return NextResponse.json({ error: "Upgrade required" }, { status: 402 });

  const form = await req.formData();
  const domain = String(form.get("domain") || "").toLowerCase().trim();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Save mapping in our DB
  await prisma.domain.create({
    data: { userId, domain, handle: user.handle },
  });

  // Attempt to add domain to Vercel project (best-effort)
  try {
    const res = await fetch(`https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });
    const json = await res.json();
    // we return JSON but continue either way
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (e) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}

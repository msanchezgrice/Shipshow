import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_FREE_PROJECTS, isPaid } from "@/lib/subscription";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paid = await isPaid(userId);
  const count = await prisma.project.count({ where: { userId } });
  if (!paid && count >= MAX_FREE_PROJECTS) {
    return NextResponse.json({ error: "Free tier limit reached" }, { status: 403 });
  }

  const created = await prisma.project.create({
    data: {
      userId,
      title: "Untitled project",
      description: "",
      url: "",
      imageUrl: "",
      sort: count,
    },
  });

  return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

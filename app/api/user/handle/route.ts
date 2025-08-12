import { auth, currentUser } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function validHandle(h: string) {
  return /^[a-z0-9-]{3,30}$/.test(h);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const handle = String(form.get("handle") || "").toLowerCase();
  if (!validHandle(handle)) return NextResponse.json({ error: "Invalid handle" }, { status: 400 });

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        handle,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
        avatarUrl: user.imageUrl || undefined,
      },
    });
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Handle already taken" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update handle" }, { status: 500 });
  }
}

import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const method = (String(form.get("_method") || "PUT")).toUpperCase();

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (method === "DELETE") {
    await prisma.project.delete({ where: { id: params.id } });
  } else {
    const title = String(form.get("title") || "Untitled project").slice(0, 140);
    const description = String(form.get("description") || "");
    const url = String(form.get("url") || "");
    const imageUrl = String(form.get("imageUrl") || "");
    const sort = Number(form.get("sort") || project.sort) || 0;

    await prisma.project.update({
      where: { id: params.id },
      data: { title, description, url, imageUrl, sort },
    });
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}

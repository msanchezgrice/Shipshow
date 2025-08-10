import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = url.searchParams.get("host")?.toLowerCase();
  if (!host) return NextResponse.json({ error: "Missing host" }, { status: 400 });

  const mapping = await prisma.domain.findFirst({ where: { domain: host } });
  if (!mapping) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ handle: mapping.handle });
}

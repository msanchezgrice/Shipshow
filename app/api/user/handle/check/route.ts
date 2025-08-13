import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle")?.toLowerCase();
  
  if (!handle) {
    return NextResponse.json({ available: false, error: "Handle required" });
  }
  
  // Validate handle format
  if (!/^[a-z0-9-]{3,30}$/.test(handle)) {
    return NextResponse.json({ available: false, error: "Invalid format" });
  }
  
  try {
    const existing = await prisma.user.findUnique({
      where: { handle },
      select: { id: true }
    });
    
    return NextResponse.json({ 
      available: !existing,
      handle 
    });
  } catch (error) {
    return NextResponse.json({ 
      available: false, 
      error: "Failed to check availability" 
    }, { status: 500 });
  }
}

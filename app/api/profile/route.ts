import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bio, twitterUrl, linkedInUrl } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio,
        twitterUrl,
        linkedInUrl,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
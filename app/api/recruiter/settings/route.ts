import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await req.json();

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // ── Slug change logic ──
    if (body.companySlug && body.companySlug !== profile.companySlug) {

      // If slug is locked → reject (needs support approval)
      if (profile.slugLocked) {
        return NextResponse.json(
          {
            error: "Your apply email is locked. Contact support with your government ID and management staff ID card to change it.",
            slugLocked: true,
          },
          { status: 403 }
        );
      }

      // Validate format
      const slugRegex = /^[a-z0-9]{3,20}$/;
      if (!slugRegex.test(body.companySlug)) {
        return NextResponse.json(
          { error: "Slug must be 3-20 characters, lowercase letters and numbers only" },
          { status: 400 }
        );
      }

      // Check availability
      const existing = await prisma.recruiterProfile.findFirst({
        where: {
          companySlug: body.companySlug,
          userId: { not: userId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "This apply email is already taken. Please choose another." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.recruiterProfile.update({
      where: { userId },
      data: {
        companyName: body.companyName ?? profile.companyName,
        companySize: body.companySize ?? profile.companySize,
        industry: body.industry ?? profile.industry,
        website: body.website ?? profile.website,
        description: body.description ?? profile.description,
        replyToEmail: body.replyToEmail ?? profile.replyToEmail,
        // Only update slug if not locked
        ...(!profile.slugLocked && body.companySlug
          ? { companySlug: body.companySlug }
          : {}),
      },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

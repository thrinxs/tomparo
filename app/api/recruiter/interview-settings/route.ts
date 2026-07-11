import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const settings = await prisma.recruiterInterviewSettings.findUnique({
      where: { recruiterId: profile.id },
    });

    return NextResponse.json({ settings: settings || null });
  } catch (error) {
    console.error("Get interview settings error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const body = await req.json();

    const settings = await prisma.recruiterInterviewSettings.upsert({
      where: { recruiterId: profile.id },
      create: {
        recruiterId: profile.id,
        globalOpening: body.globalOpening || null,
        globalOpeningType: body.globalOpeningType || "TEXT",
        globalOpeningUrl: body.globalOpeningUrl || null,
        globalClosing: body.globalClosing || null,
        globalClosingType: body.globalClosingType || "TEXT",
        globalClosingUrl: body.globalClosingUrl || null,
        globalInstructions: body.globalInstructions
          ? JSON.stringify(body.globalInstructions)
          : null,
      },
      update: {
        globalOpening: body.globalOpening ?? undefined,
        globalOpeningType: body.globalOpeningType ?? undefined,
        globalOpeningUrl: body.globalOpeningUrl ?? undefined,
        globalClosing: body.globalClosing ?? undefined,
        globalClosingType: body.globalClosingType ?? undefined,
        globalClosingUrl: body.globalClosingUrl ?? undefined,
        globalInstructions: body.globalInstructions !== undefined
          ? JSON.stringify(body.globalInstructions)
          : undefined,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Update interview settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

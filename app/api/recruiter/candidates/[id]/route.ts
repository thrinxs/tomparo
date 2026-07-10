import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const candidate = await prisma.recruiterCandidate.findFirst({
      where: { id, recruiterId: profile.id },
      include: { job: { select: { id: true, title: true } } },
    });

    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Get candidate error:", error);
    return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const existing = await prisma.recruiterCandidate.findFirst({
      where: { id, recruiterId: profile.id },
    });
    if (!existing) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    const body = await req.json();

    const candidate = await prisma.recruiterCandidate.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        notes: body.notes ?? existing.notes,
      },
    });

    if (status) {
      await logActivity({
        recruiterId: profile.id,
        type: "CANDIDATE_STATUS_CHANGED",
        title: "Candidate status updated",
        description: `${existing.candidateName || "Candidate"} → ${status}`,
        meta: { candidateName: existing.candidateName, status },
      });
    }

    return NextResponse.json({ success: true, candidate });
  } catch (error) {
    console.error("Update candidate error:", error);
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}

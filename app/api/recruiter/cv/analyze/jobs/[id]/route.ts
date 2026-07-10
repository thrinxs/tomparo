import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── PATCH — Update job ─────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    // Ensure job belongs to this recruiter
    const existingJob = await prisma.jobPosting.findFirst({
      where: { id: params.id, recruiterId: profile.id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const job = await prisma.jobPosting.update({
      where: { id: params.id },
      data: {
        title: body.title ?? existingJob.title,
        description: body.description ?? existingJob.description,
        requirements: body.requirements ?? existingJob.requirements,
        location: body.location ?? existingJob.location,
        type: body.type ?? existingJob.type,
        salaryMin: body.salaryMin ? parseInt(body.salaryMin) : existingJob.salaryMin,
        salaryMax: body.salaryMax ? parseInt(body.salaryMax) : existingJob.salaryMax,
        deadline: body.deadline ? new Date(body.deadline) : existingJob.deadline,
        status: body.status ?? existingJob.status,
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Update job error:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

// ── DELETE — Delete job ────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    const existingJob = await prisma.jobPosting.findFirst({
      where: { id: params.id, recruiterId: profile.id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    await prisma.jobPosting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete job error:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
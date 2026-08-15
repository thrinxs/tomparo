import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeCvCredibility } from "@/lib/ai/cv-credibility-analyzer";

const VERIFICATION_PLANS = [
  "RECRUITER_BUSINESS",
  "RECRUITER_ENTERPRISE",
  "RECRUITER_SCALE",
  "RECRUITER_CUSTOM",
  "ADMIN",
];

const OUTREACH_PLANS = [
  "RECRUITER_ENTERPRISE",
  "RECRUITER_SCALE",
  "RECRUITER_CUSTOM",
  "ADMIN",
];

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

    const verification = await prisma.cvVerification.findUnique({
      where: { candidateId: id },
      include: { entities: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({ verification });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get verification" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const role   = (session.user as any).role as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    if (!VERIFICATION_PLANS.includes(role)) {
      return NextResponse.json({ error: "Upgrade to Business plan to use CV verification", upgradeRequired: true }, { status: 403 });
    }

    const candidate = await prisma.recruiterCandidate.findFirst({
      where: { id, recruiterId: profile.id },
    });
    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    // Run AI credibility analysis
    const result = await analyzeCvCredibility(
      candidate.rawText || "",
      candidate.candidateName || "Unknown",
      candidate.atsScore || 0
    );

    const overallTrustScore = Math.round(
      ((candidate.atsScore || 0) * 0.6) + (result.credibilityScore * 0.4)
    );

    // Upsert verification record
    const verification = await prisma.cvVerification.upsert({
      where: { candidateId: id },
      create: {
        candidateId:      id,
        recruiterId:      profile.id,
        credibilityScore: result.credibilityScore,
        flags:            JSON.stringify(result.flags),
        overallTrustScore,
      },
      update: {
        credibilityScore: result.credibilityScore,
        flags:            JSON.stringify(result.flags),
        overallTrustScore,
      },
    });

    // Save verifiable entities
    if (result.verifiableEntities.length > 0) {
      // Delete old entities before recreating
      await prisma.cvVerifiableEntity.deleteMany({ where: { verificationId: verification.id } });

      for (const entity of result.verifiableEntities) {
        await prisma.cvVerifiableEntity.create({
          data: {
            verificationId:  verification.id,
            candidateId:     id,
            recruiterId:     profile.id,
            type:            entity.type,
            name:            entity.name,
            claimedDetail:   entity.claimedDetail || null,
            suggestedEmails: JSON.stringify(entity.suggestedEmails || []),
            status:          "PENDING",
          },
        });
      }
    }

    const fullVerification = await prisma.cvVerification.findUnique({
      where: { id: verification.id },
      include: { entities: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({
      success: true,
      verification: fullVerification,
      canSendOutreach: OUTREACH_PLANS.includes(role),
    });
  } catch (error) {
    console.error("CV verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

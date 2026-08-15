import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/supabase-storage";

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
      select: { id: true, cvFileUrl: true, fileName: true, rawText: true },
    });

    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    // If file stored in Supabase — return signed URL
    if (candidate.cvFileUrl) {
      const signedUrl = await getSignedUrl(candidate.cvFileUrl);
      if (signedUrl) {
        return NextResponse.json({ signedUrl, fileName: candidate.fileName, source: "file" });
      }
    }

    // Fallback — return raw text for client-side PDF generation
    return NextResponse.json({
      rawText: candidate.rawText,
      fileName: candidate.fileName,
      source: "text",
    });
  } catch (error) {
    console.error("CV download error:", error);
    return NextResponse.json({ error: "Failed to get CV" }, { status: 500 });
  }
}

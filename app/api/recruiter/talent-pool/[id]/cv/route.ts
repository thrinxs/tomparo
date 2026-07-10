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

    const application = await prisma.recruiterApplication.findFirst({
      where: { id, recruiterId: profile.id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (!application.cvFileUrl) {
      return NextResponse.json(
        { error: "No CV file available for this application" },
        { status: 404 }
      );
    }

    // Generate signed URL valid for 1 hour
    const signedUrl = await getSignedUrl(application.cvFileUrl, 3600);

    if (!signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate CV preview URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signedUrl,
      fileName: application.cvFileName || "CV",
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Get CV URL error:", error);
    return NextResponse.json(
      { error: "Failed to get CV" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — candidate sends live transcript chunk (called from candidate page)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { transcript, questionId } = await req.json();

    const interview = await prisma.recruiterInterview.findUnique({
      where: { shareToken: token },
      select: { id: true, status: true },
    });

    if (!interview || interview.status === "CANCELLED") {
      return NextResponse.json({ error: "Invalid" }, { status: 404 });
    }

    await prisma.recruiterInterview.update({
      where: { id: interview.id },
      data: {
        liveTranscript: transcript,
        liveTranscriptUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Transcript POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

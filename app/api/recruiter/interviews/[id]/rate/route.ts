import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { questionId, rating, flagged, recruiterNote } = await req.json();

    // Use Prisma's own generated type — permanently solves union type mismatch
    const data: Prisma.RecruiterInterviewQuestionUpdateInput = {};

    if (rating !== undefined) data.recruiterRating = rating ?? null;
    if (flagged !== undefined) data.flagged = Boolean(flagged);
    if (recruiterNote !== undefined) data.recruiterNote = recruiterNote ?? null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.recruiterInterviewQuestion.update({
      where: { id: questionId },
      data,
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error) {
    console.error("Rate error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

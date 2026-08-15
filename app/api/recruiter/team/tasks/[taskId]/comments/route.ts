import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getProfile(userId: string) {
  let profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (profile) return profile;
  const m = await prisma.recruiterTeamMember.findFirst({ where: { userId }, include: { recruiter: true } });
  return m?.recruiter || null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;
    const profile = await getProfile(userId);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

    const comment = await prisma.teamTaskComment.create({
      data: { taskId, authorId: userId, content: content.trim() },
      include: { author: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

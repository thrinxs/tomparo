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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;
    const profile = await getProfile(userId);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const room = await prisma.teamRoom.findFirst({ where: { id: roomId, recruiterId: profile.id } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const cursor = req.nextUrl.searchParams.get("cursor");
    const messages = await prisma.teamMessage.findMany({
      where: { roomId },
      include: { sender: { select: { id: true, name: true, image: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;
    const profile = await getProfile(userId);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const room = await prisma.teamRoom.findFirst({ where: { id: roomId, recruiterId: profile.id } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });

    const message = await prisma.teamMessage.create({
      data: { roomId, senderId: userId, content: content.trim() },
      include: { sender: { select: { id: true, name: true, image: true, email: true } } },
    });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

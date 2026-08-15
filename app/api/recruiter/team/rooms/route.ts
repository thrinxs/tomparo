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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;
    const profile = await getProfile(userId);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const rooms = await prisma.teamRoom.findMany({
      where: { recruiterId: profile.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    // Create default General room if none exist
    if (rooms.length === 0) {
      const general = await prisma.teamRoom.create({
        data: { recruiterId: profile.id, name: "General", description: "Team-wide announcements and discussions", isDefault: true, createdById: userId },
      });
      return NextResponse.json({ rooms: [general] });
    }

    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load rooms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;
    const profile = await getProfile(userId);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only owners and admins can create rooms
    const membership = await prisma.recruiterTeamMember.findFirst({ where: { userId, recruiterId: profile.id } });
    const isOwner = profile.userId === userId;
    if (!isOwner && membership?.role === "MEMBER") {
      return NextResponse.json({ error: "Only Admins can create channels" }, { status: 403 });
    }

    const { name, description } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Channel name required" }, { status: 400 });

    const room = await prisma.teamRoom.create({
      data: { recruiterId: profile.id, name: name.trim(), description: description?.trim() || null, isDefault: false, createdById: userId },
    });

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}

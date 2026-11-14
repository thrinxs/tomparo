import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; projectId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: portfolioId, projectId } = await params;

    const portfolio = await prisma.portfolio.findFirst({ where: { id: portfolioId, userId } });
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    if (body.tags && Array.isArray(body.tags)) body.tags = JSON.stringify(body.tags);
    if (body.mediaFiles && Array.isArray(body.mediaFiles)) body.mediaFiles = JSON.stringify(body.mediaFiles);

    const updated = await prisma.portfolioProject.update({ where: { id: projectId }, data: body });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PROJECT_PUT]", err);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; projectId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: portfolioId, projectId } = await params;

    const portfolio = await prisma.portfolio.findFirst({ where: { id: portfolioId, userId } });
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.portfolioProject.delete({ where: { id: projectId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PROJECT_DELETE]", err);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}

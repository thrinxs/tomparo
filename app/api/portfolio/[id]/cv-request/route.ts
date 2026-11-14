import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const requestedById = (session.user as any).id;
    const { id: portfolioId } = await params;

    const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (portfolio.userId === requestedById) {
      return NextResponse.json({ error: "You cannot request your own CV" }, { status: 400 });
    }

    // Check if already requested
    const existing = await prisma.cVRequest.findFirst({
      where: { portfolioId, requestedById, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json({ error: "You already have a pending request for this portfolio" }, { status: 400 });
    }

    const { message } = await req.json();

    const cvRequest = await prisma.cVRequest.create({
      data: {
        portfolioId,
        portfolioUserId: portfolio.userId,
        requestedById,
        message: message || "",
        status: "PENDING",
      },
    });

    // Notify portfolio owner
    const requester = await prisma.user.findUnique({ where: { id: requestedById }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: portfolio.userId,
        type: "CV_REQUEST",
        title: "CV Request Received",
        body: `${requester?.name || "Someone"} has requested to view your CV from your portfolio "${portfolio.title}".`,
        link: `/dashboard/portfolio/requests`,
        meta: JSON.stringify({ cvRequestId: cvRequest.id, portfolioId }),
      },
    });

    return NextResponse.json({ success: true, id: cvRequest.id });
  } catch (err) {
    console.error("[CV_REQUEST_POST]", err);
    return NextResponse.json({ error: "Failed to send CV request" }, { status: 500 });
  }
}

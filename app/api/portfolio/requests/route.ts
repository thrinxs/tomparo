import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const requests = await prisma.cVRequest.findMany({
      where: { portfolioUserId: userId },
      include: {
        requestedBy: { select: { id: true, name: true, email: true, image: true } },
        portfolio: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (err) {
    console.error("[CV_REQUESTS_GET]", err);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const { id, action } = await req.json(); // action: "approve" | "deny"

    const cvRequest = await prisma.cVRequest.findFirst({
      where: { id, portfolioUserId: userId },
      include: { portfolio: true },
    });
    if (!cvRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.cVRequest.update({
      where: { id },
      data: {
        status: action === "approve" ? "APPROVED" : "DENIED",
        approvedAt: action === "approve" ? new Date() : null,
      },
    });

    // Notify requester
    const owner = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: cvRequest.requestedById,
        type: action === "approve" ? "CV_APPROVED" : "CV_DENIED",
        title: action === "approve" ? "CV Request Approved" : "CV Request Declined",
        body: action === "approve"
          ? `${owner?.name || "The talent"} approved your CV request. You can now view their CV.`
          : `${owner?.name || "The talent"} declined your CV request.`,
        link: action === "approve" ? `/portfolio/${cvRequest.portfolio.slug}` : `/portfolio/explore`,
        meta: JSON.stringify({ cvRequestId: id }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[CV_REQUESTS_PUT]", err);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const likedById = (session.user as any).id;
    const { id: portfolioId } = await params;

    const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await prisma.portfolioLike.findUnique({
      where: { portfolioId_likedById: { portfolioId, likedById } },
    });

    if (existing) {
      // Unlike
      await prisma.portfolioLike.delete({ where: { id: existing.id } });
      await prisma.portfolio.update({
        where: { id: portfolioId },
        data: { likesCount: { decrement: 1 } },
      });
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.portfolioLike.create({ data: { portfolioId, likedById } });
      await prisma.portfolio.update({
        where: { id: portfolioId },
        data: { likesCount: { increment: 1 } },
      });
      // Notify portfolio owner
      await prisma.notification.create({
        data: {
          userId: portfolio.userId,
          type: "PORTFOLIO_LIKE",
          title: "Someone liked your portfolio",
          body: `Your portfolio "${portfolio.title}" received a new like.`,
          link: `/dashboard/portfolio`,
          meta: JSON.stringify({ portfolioId }),
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (err) {
    console.error("[PORTFOLIO_LIKE]", err);
    return NextResponse.json({ error: "Failed to like portfolio" }, { status: 500 });
  }
}

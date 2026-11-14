import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: { projects: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(portfolios);
  } catch (err) {
    console.error("[PORTFOLIO_GET]", err);
    return NextResponse.json({ error: "Failed to fetch portfolios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const isPremium = (session.user as any).isPremium;

    // Free plan: max 1 portfolio
    if (!isPremium) {
      const count = await prisma.portfolio.count({ where: { userId } });
      if (count >= 1) {
        return NextResponse.json(
          { error: "Free plan is limited to 1 portfolio. Upgrade to Premium for unlimited portfolios." },
          { status: 403 }
        );
      }
    }

    const { title, slug, category, tagline, coverImage, template, visibility } = await req.json();

    if (!title || !slug || !category) {
      return NextResponse.json({ error: "Title, slug and category are required" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.portfolio.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "This URL slug is already taken. Try another." }, { status: 400 });
    }

    // If first portfolio, make it default
    const count = await prisma.portfolio.count({ where: { userId } });

    const portfolio = await prisma.portfolio.create({
      data: {
        userId,
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        category,
        tagline: tagline || "",
        coverImage: coverImage || "",
        template: isPremium ? (template || "default") : "default",
        visibility: visibility || "PUBLIC",
        isDefault: count === 0,
      },
    });

    return NextResponse.json(portfolio);
  } catch (err) {
    console.error("[PORTFOLIO_POST]", err);
    return NextResponse.json({ error: "Failed to create portfolio" }, { status: 500 });
  }
}

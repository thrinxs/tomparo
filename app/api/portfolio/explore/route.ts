import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const search   = searchParams.get("search") || "";
    const page     = parseInt(searchParams.get("page") || "1");
    const limit    = 12;

    const where: any = {
      onDiscovery: true,
      visibility: "PUBLIC",
    };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { tagline: { contains: search, mode: "insensitive" } },
      ];
    }

    const [portfolios, total] = await Promise.all([
      prisma.portfolio.findMany({
        where,
        include: {
          user: { select: { name: true, image: true } },
          projects: { take: 3, orderBy: { order: "asc" } },
          _count: { select: { likes: true } },
        },
        orderBy: { likesCount: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.portfolio.count({ where }),
    ]);

    return NextResponse.json({ portfolios, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[EXPLORE_GET]", err);
    return NextResponse.json({ error: "Failed to fetch portfolios" }, { status: 500 });
  }
}

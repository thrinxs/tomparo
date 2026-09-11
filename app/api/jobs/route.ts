import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query    = searchParams.get("q") || "";
    const type     = searchParams.get("type") || "";
    const location = searchParams.get("location") || "";
    const salary   = searchParams.get("salary") || "";
    const page     = parseInt(searchParams.get("page") || "1");
    const limit    = 12;
    const skip     = (page - 1) * limit;

    const where: any = { status: "ACTIVE" };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
      ];
    }

    if (type) where.type = type;

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (salary === "entry") where.salaryMax = { lte: 200000 };
    if (salary === "mid") { where.salaryMin = { gte: 200000 }; where.salaryMax = { lte: 500000 }; }
    if (salary === "senior") where.salaryMin = { gte: 500000 };

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          recruiter: {
            select: {
              companyName: true,
              companySlug: true,
              logo: true,
              industry: true,
            },
          },
          _count: { select: { applications: true } },
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      jobs,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    console.error("Jobs listing error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

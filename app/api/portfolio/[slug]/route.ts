import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    include: { user: { select: { name: true, image: true, createdAt: true } } },
  });
  if (!portfolio) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  if (!portfolio.isPublic) return NextResponse.json({ error: "This portfolio is private" }, { status: 403 });

  // Increment view count
  await prisma.portfolio.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
  });

  const parsed = {
    ...portfolio,
    skills: portfolio.skills ? JSON.parse(portfolio.skills) : [],
    experience: portfolio.experience ? JSON.parse(portfolio.experience) : [],
    projects: portfolio.projects ? JSON.parse(portfolio.projects) : [],
    education: portfolio.education ? JSON.parse(portfolio.education) : [],
    certifications: portfolio.certifications ? JSON.parse(portfolio.certifications) : [],
  };

  return NextResponse.json({ portfolio: parsed });
}

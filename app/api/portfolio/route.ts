import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: (session.user as any).id },
  });
  return NextResponse.json({ portfolio });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();
  const {
    slug, isPublic, headline, bio, location, avatar,
    email, phone, website, twitter, linkedin, github,
    skills, experience, projects, education, certifications,
  } = body;

  if (slug) {
    const existing = await prisma.portfolio.findUnique({ where: { slug } });
    if (existing && existing.userId !== userId) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }
    const validSlug = /^[a-z0-9-]+$/.test(slug);
    if (!validSlug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.upsert({
    where: { userId },
    create: {
      userId, slug: slug || userId,
      isPublic: isPublic ?? false,
      headline, bio, location, avatar,
      email, phone, website, twitter, linkedin, github,
      skills: skills ? JSON.stringify(skills) : null,
      experience: experience ? JSON.stringify(experience) : null,
      projects: projects ? JSON.stringify(projects) : null,
      education: education ? JSON.stringify(education) : null,
      certifications: certifications ? JSON.stringify(certifications) : null,
    },
    update: {
      ...(slug && { slug }),
      ...(isPublic !== undefined && { isPublic }),
      ...(headline !== undefined && { headline }),
      ...(bio !== undefined && { bio }),
      ...(location !== undefined && { location }),
      ...(avatar !== undefined && { avatar }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(website !== undefined && { website }),
      ...(twitter !== undefined && { twitter }),
      ...(linkedin !== undefined && { linkedin }),
      ...(github !== undefined && { github }),
      ...(skills !== undefined && { skills: JSON.stringify(skills) }),
      ...(experience !== undefined && { experience: JSON.stringify(experience) }),
      ...(projects !== undefined && { projects: JSON.stringify(projects) }),
      ...(education !== undefined && { education: JSON.stringify(education) }),
      ...(certifications !== undefined && { certifications: JSON.stringify(certifications) }),
    },
  });

  return NextResponse.json({ portfolio });
}

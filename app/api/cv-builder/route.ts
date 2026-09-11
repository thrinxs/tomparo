import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list all CVs for user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const cvs = await prisma.builtCV.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, title: true, template: true,
        fullName: true, createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, cvs });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — create new CV
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const isPremium = (session.user as any).isPremium;

    const body = await req.json();
    const { title, template, fullName, email, phone, location,
            linkedin, website, summary, experience, education,
            skills, certifications } = body;

    // Free users can only use basic template
    const finalTemplate = isPremium ? (template ?? "basic") : "basic";

    const cv = await prisma.builtCV.create({
      data: {
        userId, title: title || "My CV", template: finalTemplate,
        fullName, email, phone, location, linkedin, website,
        summary,
        experience: experience ? JSON.stringify(experience) : null,
        education: education ? JSON.stringify(education) : null,
        skills: skills ? JSON.stringify(skills) : null,
        certifications: certifications ? JSON.stringify(certifications) : null,
      },
    });

    return NextResponse.json({ success: true, cv });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

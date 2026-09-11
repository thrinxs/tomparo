import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — single CV
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id } = await params;

    const cv = await prisma.builtCV.findFirst({ where: { id, userId } });
    if (!cv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, cv });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — update CV
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const isPremium = (session.user as any).isPremium;
    const { id } = await params;

    const body = await req.json();
    const { title, template, fullName, email, phone, location,
            linkedin, website, summary, experience, education,
            skills, certifications } = body;

    const finalTemplate = isPremium ? (template ?? "basic") : "basic";

    const cv = await prisma.builtCV.updateMany({
      where: { id, userId },
      data: {
        title: title || "My CV", template: finalTemplate,
        fullName, email, phone, location, linkedin, website,
        summary,
        experience: experience ? JSON.stringify(experience) : null,
        education: education ? JSON.stringify(education) : null,
        skills: skills ? JSON.stringify(skills) : null,
        certifications: certifications ? JSON.stringify(certifications) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id } = await params;

    await prisma.builtCV.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

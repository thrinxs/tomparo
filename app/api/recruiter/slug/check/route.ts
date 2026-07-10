import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "")
    .replace(/-+/g, "")
    .slice(0, 20);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const excludeId = searchParams.get("excludeId");

    if (!slug) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const slugRegex = /^[a-z0-9]{3,20}$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({
        available: false,
        error: "Username must be 3-20 characters, lowercase letters and numbers only",
      });
    }

    const reserved = [
      "admin", "support", "help", "jobs", "apply", "hire",
      "tomparo", "recruiter", "dashboard", "api", "www",
      "info", "hello", "career", "noreply", "billing",
      "sales", "press", "partners", "talent", "interviews",
    ];

    if (reserved.includes(slug)) {
      return NextResponse.json({
        available: false,
        error: "This username is reserved",
      });
    }

    const where: any = { companySlug: slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await prisma.recruiterProfile.findFirst({ where });

    return NextResponse.json({
      available: !existing,
      slug,
      applyEmail: `${slug}-apply@tomparo.com`,
    });
  } catch (error) {
    console.error("Slug check error:", error);
    return NextResponse.json({ error: "Failed to check username" }, { status: 500 });
  }
}

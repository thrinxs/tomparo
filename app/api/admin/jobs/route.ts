import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function adminOnly(role: string) { return role === "ADMIN"; }

// GET — all jobs for admin (pending + approved + rejected)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!adminOnly((session?.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const approvalStatus = searchParams.get("approvalStatus") || "";
    const source = searchParams.get("source") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const where: any = {};
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (source) where.source = source;

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          recruiter: { select: { companyName: true, companySlug: true } },
          _count: { select: { applications: true } },
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return NextResponse.json({ success: true, jobs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — admin creates a job manually
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!adminOnly((session?.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const {
      title, description, requirements, location, type,
      salaryMin, salaryMax, deadline, externalUrl,
      sourceCompanyName,
    } = body;

    if (!title || !description)
      return NextResponse.json({ error: "Title and description required" }, { status: 400 });

    // Find TomParo Featured recruiter profile
    const tomparoProfile = await prisma.recruiterProfile.findFirst({
      where: { companySlug: "tomparo-featured" },
    });

    if (!tomparoProfile)
      return NextResponse.json({ error: "TomParo Featured profile not found. Run setup SQL." }, { status: 400 });

    const jobSlug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60) + "-" + Date.now().toString(36);

    const job = await prisma.jobPosting.create({
      data: {
        recruiterId: tomparoProfile.id,
        title,
        description,
        requirements: requirements || null,
        location: location || null,
        type: type || "FULL_TIME",
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        deadline: deadline ? new Date(deadline) : null,
        status: "ACTIVE",
        approvalStatus: "APPROVED",
        source: sourceCompanyName ? "SCRAPED" : "ADMIN",
        externalUrl: externalUrl || null,
        sourceCompanyName: sourceCompanyName || null,
        postedByAdmin: true,
        jobSlug,
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (err) {
    console.error("Admin post job error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — approve/reject/edit a job
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!adminOnly((session?.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const { jobId, approvalStatus, title, description, location, type, salaryMin, salaryMax, deadline } = body;

    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    const data: any = {};
    if (approvalStatus) {
      data.approvalStatus = approvalStatus;
      if (approvalStatus === "APPROVED") data.status = "ACTIVE";
      if (approvalStatus === "REJECTED") data.status = "CLOSED";
    }
    if (title) data.title = title;
    if (description) data.description = description;
    if (location !== undefined) data.location = location;
    if (type) data.type = type;
    if (salaryMin !== undefined) data.salaryMin = salaryMin ? parseInt(salaryMin) : null;
    if (salaryMax !== undefined) data.salaryMax = salaryMax ? parseInt(salaryMax) : null;
    if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;

    const job = await prisma.jobPosting.update({ where: { id: jobId }, data });
    return NextResponse.json({ success: true, job });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE — remove a job
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!adminOnly((session?.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { jobId } = await req.json();
    await prisma.jobPosting.delete({ where: { id: jobId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

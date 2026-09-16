import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { jobs } = await req.json();

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0)
      return NextResponse.json({ error: "No jobs to save" }, { status: 400 });

    const tomparoProfile = await prisma.recruiterProfile.findFirst({
      where: { companySlug: "tomparo-featured" },
    });

    if (!tomparoProfile)
      return NextResponse.json({ error: "TomParo Featured profile not found" }, { status: 400 });

    let saved = 0;
    for (const job of jobs) {
      const jobSlug = (job.title || "job").toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60) + "-" + Date.now().toString(36);

      await prisma.jobPosting.create({
        data: {
          recruiterId: tomparoProfile.id,
          title: job.title || "Untitled",
          description: job.description || "",
          requirements: job.requirements || null,
          location: job.location || null,
          type: job.type || "FULL_TIME",
          salaryMin: job.salaryMin || null,
          salaryMax: job.salaryMax || null,
          deadline: job.deadline ? new Date(job.deadline) : null,
          status: "ACTIVE",
          approvalStatus: "PENDING",
          source: "ADMIN",
          externalUrl: job.externalUrl || null,
          sourceCompanyName: job.company || null,
          postedByAdmin: true,
          jobSlug,
        },
      });
      saved++;
    }

    return NextResponse.json({ success: true, saved });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

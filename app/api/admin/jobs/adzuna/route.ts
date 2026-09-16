import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID!;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY!;

const COUNTRIES = ["ng", "gb", "us", "ca", "au", "za"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { keyword = "software", country = "ng", pages = 1 } = await req.json();

    const tomparoProfile = await prisma.recruiterProfile.findFirst({
      where: { companySlug: "tomparo-featured" },
    });

    if (!tomparoProfile)
      return NextResponse.json({ error: "TomParo Featured profile not found" }, { status: 400 });

    let totalImported = 0;
    let totalSkipped = 0;

    for (let page = 1; page <= Math.min(pages, 5); page++) {
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=20&what=${encodeURIComponent(keyword)}&content-type=application/json`;

      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      const results = data.results || [];

      for (const job of results) {
        // Skip if already imported (check by externalUrl)
        const existing = await prisma.jobPosting.findFirst({
          where: { externalUrl: job.redirect_url },
        });
        if (existing) { totalSkipped++; continue; }

        const jobSlug = (job.title || "job").toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 60) + "-" + Date.now().toString(36);

        await prisma.jobPosting.create({
          data: {
            recruiterId: tomparoProfile.id,
            title: job.title || "Untitled",
            description: job.description || "",
            location: job.location?.display_name || null,
            type: "FULL_TIME",
            salaryMin: job.salary_min ? Math.round(job.salary_min) : null,
            salaryMax: job.salary_max ? Math.round(job.salary_max) : null,
            salaryCurrency: country === "ng" ? "NGN" : country === "gb" ? "GBP" : "USD",
            status: "ACTIVE",
            approvalStatus: "PENDING",
            source: "ADZUNA",
            externalUrl: job.redirect_url,
            sourceCompanyName: job.company?.display_name || null,
            postedByAdmin: false,
            jobSlug,
          },
        });
        totalImported++;
      }
    }

    return NextResponse.json({ success: true, imported: totalImported, skipped: totalSkipped });
  } catch (err) {
    console.error("Adzuna fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch from Adzuna" }, { status: 500 });
  }
}

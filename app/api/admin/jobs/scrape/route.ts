import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJSONWithGemini } from "@/lib/gemini";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;

async function scrapeUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
    });
    const data = await res.json();
    return data.data?.markdown || null;
  } catch {
    return null;
  }
}

async function extractJobsFromMarkdown(markdown: string, companyName: string, sourceUrl: string): Promise<any[]> {
  const prompt = `
You are a job listing extractor.

Below is the content of ${companyName}'s career page scraped from ${sourceUrl}.

Extract ALL job listings from this content and return them as a JSON array.
Each job should have:
{
  "title": "string",
  "description": "string (full job description if available, otherwise summary)",
  "location": "string or null",
  "type": "FULL_TIME | PART_TIME | CONTRACT | REMOTE | HYBRID",
  "requirements": "string or null",
  "externalUrl": "string (direct apply URL if found, otherwise the source URL)"
}

Return ONLY a valid JSON array. No markdown, no explanation.
If no jobs found, return [].

CONTENT:
${markdown.slice(0, 12000)}
`.trim();

  try {
    const result = await generateJSONWithGemini(prompt);
    return Array.isArray(result) ? result : [];
  } catch {
    return [] as any[];
  }
}

// POST — scrape a career page URL
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { url, companyName } = await req.json();

    if (!url || !companyName)
      return NextResponse.json({ error: "url and companyName required" }, { status: 400 });

    const tomparoProfile = await prisma.recruiterProfile.findFirst({
      where: { companySlug: "tomparo-featured" },
    });

    if (!tomparoProfile)
      return NextResponse.json({ error: "TomParo Featured profile not found" }, { status: 400 });

    // Save/update career source
    await prisma.careerSource.upsert({
      where: { id: (await prisma.careerSource.findFirst({ where: { careerUrl: url } }))?.id || "new" },
      create: { companyName, careerUrl: url, lastScanned: new Date() },
      update: { lastScanned: new Date() },
    });

    // Scrape the page
    const markdown = await scrapeUrl(url);
    if (!markdown)
      return NextResponse.json({ error: "Failed to scrape page. Check the URL." }, { status: 400 });

    // Extract jobs using AI
    const jobs = await extractJobsFromMarkdown(markdown, companyName, url);

    if (!jobs.length)
      return NextResponse.json({ success: true, imported: 0, message: "No jobs found on this page" });

    // Save jobs as pending
    let imported = 0;
    for (const job of jobs) {
      const existing = await prisma.jobPosting.findFirst({
        where: { title: job.title, scrapedFrom: url },
      });
      if (existing) continue;

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
          status: "ACTIVE",
          approvalStatus: "PENDING",
          source: "SCRAPED",
          externalUrl: job.externalUrl || url,
          sourceCompanyName: companyName,
          scrapedFrom: url,
          postedByAdmin: false,
          jobSlug,
        },
      });
      imported++;
    }

    // Update career source job count
    await prisma.careerSource.updateMany({
      where: { careerUrl: url },
      data: { jobsFound: { increment: imported }, lastScanned: new Date() },
    });

    return NextResponse.json({ success: true, imported, total: jobs.length });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET — list all career sources
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const sources = await prisma.careerSource.findMany({
      orderBy: { lastScanned: "desc" },
    });
    return NextResponse.json({ success: true, sources });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

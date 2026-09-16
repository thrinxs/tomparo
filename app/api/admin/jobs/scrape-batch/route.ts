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

async function extractJobs(markdown: string, companyName: string, sourceUrl: string): Promise<any[]> {
  const prompt = `
You are a job listing extractor.
Extract ALL job listings from this career page content for "${companyName}" (${sourceUrl}).

Return a JSON array where each item has:
{
  "title": "string",
  "description": "string",
  "location": "string or null",
  "type": "FULL_TIME | PART_TIME | CONTRACT | REMOTE | HYBRID",
  "requirements": "string or null",
  "externalUrl": "string (apply URL if found, else source URL)"
}

Return ONLY valid JSON array. If no jobs found return [].

CONTENT:
${markdown.slice(0, 12000)}
`.trim();

  try {
    const result = await generateJSONWithGemini(prompt);
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0)
      return NextResponse.json({ error: "urls array is required" }, { status: 400 });

    if (urls.length > 20)
      return NextResponse.json({ error: "Maximum 20 URLs per batch" }, { status: 400 });

    const tomparoProfile = await prisma.recruiterProfile.findFirst({
      where: { companySlug: "tomparo-featured" },
    });

    if (!tomparoProfile)
      return NextResponse.json({ error: "TomParo Featured profile not found" }, { status: 400 });

    const results: Array<{
      url: string;
      company: string;
      imported: number;
      error?: string;
    }> = [];

    for (const urlEntry of urls) {
      const url = typeof urlEntry === "string" ? urlEntry.trim() : urlEntry.url?.trim();
      if (!url || !url.startsWith("http")) {
        results.push({ url: url || "invalid", company: "—", imported: 0, error: "Invalid URL" });
        continue;
      }

      // Auto-detect company name
      let companyName = typeof urlEntry === "object" ? urlEntry.company : "";
      if (!companyName) {
        try {
          companyName = new URL(url).hostname
            .replace(/^www\./, "")
            .split(".")[0]
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
        } catch {
          companyName = "Unknown";
        }
      }

      try {
        // Scrape
        const markdown = await scrapeUrl(url);
        if (!markdown) {
          results.push({ url, company: companyName, imported: 0, error: "Failed to fetch page" });
          continue;
        }

        // Extract jobs
        const jobs = await extractJobs(markdown, companyName, url);
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

        // Save career source
        const existing = await prisma.careerSource.findFirst({ where: { careerUrl: url } });
        if (existing) {
          await prisma.careerSource.update({
            where: { id: existing.id },
            data: { lastScanned: new Date(), jobsFound: { increment: imported } },
          });
        } else {
          await prisma.careerSource.create({
            data: { companyName, careerUrl: url, lastScanned: new Date(), jobsFound: imported },
          });
        }

        results.push({ url, company: companyName, imported });
      } catch (err: any) {
        results.push({ url, company: companyName, imported: 0, error: err.message });
      }

      // Small delay between requests to be respectful
      await new Promise((r) => setTimeout(r, 500));
    }

    const totalImported = results.reduce((sum, r) => sum + r.imported, 0);

    return NextResponse.json({
      success: true,
      results,
      totalImported,
      totalUrls: urls.length,
    });
  } catch (err) {
    console.error("Batch scrape error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

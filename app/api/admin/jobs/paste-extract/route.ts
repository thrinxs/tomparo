import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJSONWithGemini, generateWithGemini } from "@/lib/gemini";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;

async function searchForMoreInfo(jobTitle: string, companyName: string): Promise<string> {
  try {
    // Use Firecrawl search to find more details
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        query: `${jobTitle} ${companyName} job vacancy 2024 2025`,
        limit: 3,
      }),
    });
    const data = await res.json();
    const results = data.data || [];
    return results.map((r: any) => r.markdown || r.description || "").join("\n\n").slice(0, 5000);
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { text } = await req.json();

    if (!text || text.trim().length < 20)
      return NextResponse.json({ error: "Paste some job information to extract" }, { status: 400 });

    // Step 1: Extract job listings from pasted text
    const extractPrompt = `
You are a job listing extractor. The user has pasted raw text that may contain one or more job vacancies.

Extract ALL job listings from this text. For each job return:
{
  "title": "string",
  "company": "string or null",
  "location": "string or null",
  "type": "FULL_TIME | PART_TIME | CONTRACT | REMOTE | HYBRID",
  "description": "string (expand and clean up the description)",
  "requirements": "string or null",
  "salaryMin": number or null,
  "salaryMax": number or null,
  "deadline": "ISO date string or null",
  "externalUrl": "string (apply URL if mentioned, else null)"
}

Return ONLY a valid JSON array. If nothing found return [].

TEXT:
${text.slice(0, 8000)}
`.trim();

    const extracted = await generateJSONWithGemini(extractPrompt) as any[];

    if (!Array.isArray(extracted) || extracted.length === 0)
      return NextResponse.json({ success: true, jobs: [], message: "No job listings found in the pasted text" });

    // Step 2: For each job, search for more info online
    const enrichedJobs = [];

    for (const job of extracted.slice(0, 10)) { // max 10 jobs per paste
      let enrichedDescription = job.description || "";

      if (job.company && job.title) {
        const moreInfo = await searchForMoreInfo(job.title, job.company);
        if (moreInfo) {
          // Use Gemini to merge original + web info into a better description
          const mergePrompt = `
You have a job listing and additional web research about it.
Combine them into a comprehensive, well-formatted job description.
Keep it factual. Do not invent requirements not mentioned.

ORIGINAL:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Requirements: ${job.requirements}

WEB RESEARCH:
${moreInfo}

Return ONLY the enhanced description as plain text (no JSON, no markdown headers).
`.trim();

          try {
            enrichedDescription = await generateWithGemini(mergePrompt);
          } catch {
            enrichedDescription = job.description || "";
          }
        }
      }

      enrichedJobs.push({
        ...job,
        description: enrichedDescription,
        _enriched: true,
      });

      // Small delay
      await new Promise((r) => setTimeout(r, 300));
    }

    return NextResponse.json({
      success: true,
      jobs: enrichedJobs,
      count: enrichedJobs.length,
    });
  } catch (err) {
    console.error("Paste extract error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

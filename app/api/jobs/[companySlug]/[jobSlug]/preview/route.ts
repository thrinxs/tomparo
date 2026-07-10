import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateJSONWithGemini } from "@/lib/gemini";

async function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    import("pdf2json").then((module) => {
      const PDFParser = module.default;
      const pdfParser = new (PDFParser as any)(null, 1);
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(new Error(errData.parserError)));
      pdfParser.on("pdfParser_dataReady", () => {
        try { resolve((pdfParser as any).getRawTextContent()); }
        catch (e) { reject(e); }
      });
      pdfParser.parseBuffer(buffer);
    }).catch(reject);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companySlug: string; jobSlug: string }> }
) {
  try {
    const { companySlug, jobSlug } = await params;

    const profile = await prisma.recruiterProfile.findFirst({
      where: { companySlug },
    });

    if (!profile) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const job = await prisma.jobPosting.findFirst({
      where: { recruiterId: profile.id, jobSlug, status: "ACTIVE" },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // ── Extract CV text ──
    const formData = await req.formData();
    const cvFile = formData.get("cv") as File | null;

    if (!cvFile) {
      return NextResponse.json({ error: "CV file required" }, { status: 400 });
    }

    const buffer = Buffer.from(await cvFile.arrayBuffer());
    let cvText = "";

    if (cvFile.type === "application/pdf") {
      cvText = await extractPdfText(buffer);
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      cvText = result.value;
    }

    cvText = cvText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

    if (cvText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract text from CV" },
        { status: 400 }
      );
    }

    // ── AI match analysis ──
    const prompt = `You are a recruiter analysing a candidate's CV against a job description.

JOB TITLE: ${job.title}
JOB DESCRIPTION: ${job.description?.slice(0, 2000)}
JOB REQUIREMENTS: ${job.requirements?.slice(0, 1000) || "Not specified"}

CANDIDATE CV:
${cvText.slice(0, 5000)}

Analyse how well this candidate matches this specific job and return ONLY valid JSON:
{
  "matchScore": 78,
  "verdict": "Good Match",
  "summary": "One sentence about this candidate's fit for this specific role",
  "matchedSkills": ["skill1", "skill2", "skill3"],
  "missingSkills": ["missing1", "missing2"],
  "strengths": ["Strength relevant to this job"],
  "suggestions": ["One tip to improve their application for this role"],
  "candidateName": "Extracted name or null",
  "experienceLevel": "Junior | Mid | Senior | Lead"
}

Verdict options: "Strong Match" (85+), "Good Match" (65-84), "Partial Match" (45-64), "Weak Match" (below 45)`;

    const result = await generateJSONWithGemini<any>(prompt, "cv-analysis");

    return NextResponse.json({ success: true, preview: result });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: "Failed to analyse CV" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeRecruiterCV } from "@/lib/ai/recruiter-cv-analyzer";
import { uploadCV } from "@/lib/supabase-storage";

async function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    import("pdf2json").then((module) => {
      const PDFParser = module.default;
      const pdfParser = new (PDFParser as any)(null, 1);
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(errData.parserError));
      });
      pdfParser.on("pdfParser_dataReady", () => {
        try {
          const text = (pdfParser as any).getRawTextContent();
          resolve(text);
        } catch (e) {
          reject(e);
        }
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
      return NextResponse.json(
        { error: "Job not found or no longer accepting applications" },
        { status: 404 }
      );
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return NextResponse.json(
        { error: "Application deadline has passed" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const candidateName = formData.get("candidateName") as string;
    const candidateEmail = formData.get("candidateEmail") as string;
    const candidatePhone = formData.get("candidatePhone") as string;
    const coverLetter = formData.get("coverLetter") as string;
    const cvFile = formData.get("cv") as File | null;

    if (!candidateName || !candidateEmail) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // ── Check duplicate ──
    const existing = await prisma.recruiterApplication.findFirst({
      where: { recruiterId: profile.id, jobId: job.id, candidateEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already applied for this position" },
        { status: 409 }
      );
    }

    // ── Process CV ──
    let cvText = "";
    let cvFileName = "";
    let cvFileUrl: string | null = null;

    if (cvFile && cvFile.size > 0) {
      cvFileName = cvFile.name;
      const buffer = Buffer.from(await cvFile.arrayBuffer());

      // Extract text
      try {
        if (cvFile.type === "application/pdf") {
          cvText = await extractPdfText(buffer);
        } else {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer });
          cvText = result.value;
        }
        cvText = cvText
          .replace(/\r\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .replace(/[ \t]+/g, " ")
          .trim();
      } catch (err) {
        console.error("Text extraction failed:", err);
      }

      // Upload to Supabase Storage
      const folder = `${profile.id}/${job.id}`;
      cvFileUrl = await uploadCV(buffer, cvFileName, cvFile.type, folder);
    }

    // ── AI analyse ──
    let aiAnalysis = null;
    let atsScore = 0;
    let aiSummary = "";

    if (cvText && cvText.length > 100) {
      try {
        aiAnalysis = await analyzeRecruiterCV(cvText);
        atsScore = aiAnalysis.atsScore || 0;
        aiSummary = aiAnalysis.summary || "";
      } catch (err) {
        console.error("AI analysis failed:", err);
      }
    }

    // ── Save application ──
    const application = await prisma.recruiterApplication.create({
      data: {
        recruiterId: profile.id,
        jobId: job.id,
        candidateName,
        candidateEmail,
        candidatePhone: candidatePhone || null,
        coverLetter: coverLetter || null,
        cvText: cvText ? cvText.slice(0, 50000) : null,
        cvFileName: cvFileName || null,
        cvFileUrl: cvFileUrl || null,
        aiAnalysis: aiAnalysis ? JSON.stringify(aiAnalysis) : null,
        atsScore,
        aiSummary,
        source: "form",
        status: "UNREAD",
      },
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      aiAnalysis,
      atsScore,
      aiSummary,
    });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
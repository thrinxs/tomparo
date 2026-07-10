import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

// ── Helper: extract PDF text ──────────────────────────────────────────────────
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

// ── Helper: extract DOC/DOCX text ─────────────────────────────────────────────
async function extractDocText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// ── Helper: clean text ────────────────────────────────────────────────────────
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// ── POST: Unzip and extract all CV texts ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string;

    const profile = await prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    // ── Check monthly quota remaining ──
    const cvLimits: Record<string, number> = {
      FREE: 2,
      RECRUITER_STARTER: 20,
      RECRUITER_GROWTH: 50,
      RECRUITER_BUSINESS: 200,
      RECRUITER_ENTERPRISE: 500,
      RECRUITER_SCALE: 1000,
      RECRUITER_CUSTOM: 99999,
      ADMIN: 99999,
    };

    const limit = cvLimits[role] ?? 0;

    // Reset monthly if needed
    const now = new Date();
    const resetDate = new Date(profile.cvsResetDate);
    const monthDiff =
      (now.getFullYear() - resetDate.getFullYear()) * 12 +
      (now.getMonth() - resetDate.getMonth());

    if (monthDiff >= 1) {
      await prisma.recruiterProfile.update({
        where: { id: profile.id },
        data: { cvsUsedThisMonth: 0, cvsResetDate: now },
      });
      profile.cvsUsedThisMonth = 0;
    }

    const remaining = Math.max(0, limit - profile.cvsUsedThisMonth);

    if (remaining === 0) {
      return NextResponse.json(
        {
          error: "Monthly CV limit reached. Upgrade your plan for more.",
          limitReached: true,
          limit,
          used: profile.cvsUsedThisMonth,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // ── Parse ZIP ──
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Please upload a ZIP file" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dynamic import of adm-zip
    const AdmZip = (await import("adm-zip")).default;
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    // ── Process each CV file ──
    const supportedExtensions = [".pdf", ".doc", ".docx"];
    const cvFiles: {
      id: string;
      fileName: string;
      size: number;
      text: string;
      error?: string;
    }[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const fileName = entry.entryName.split("/").pop() || entry.entryName;

      // Skip hidden files and unsupported types
      if (fileName.startsWith(".")) continue;
      const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
      if (!supportedExtensions.includes(ext)) continue;

      try {
        const fileBuffer = entry.getData();
        let text = "";

        if (ext === ".pdf") {
          text = await extractPdfText(fileBuffer);
        } else {
          text = await extractDocText(fileBuffer);
        }

        const cleaned = cleanText(text);

        if (cleaned.length < 50) {
          cvFiles.push({
            id: `cv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            fileName,
            size: fileBuffer.length,
            text: "",
            error: "Could not extract text from this file",
          });
          continue;
        }

        cvFiles.push({
          id: `cv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          fileName,
          size: fileBuffer.length,
          text: cleaned,
        });
      } catch (err) {
        cvFiles.push({
          id: `cv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          fileName,
          size: 0,
          text: "",
          error: "Failed to read this file",
        });
      }
    }

    if (cvFiles.length === 0) {
      return NextResponse.json(
        {
          error: "No supported CV files found in ZIP. Please include PDF, DOC, or DOCX files.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      cvFiles,
      total: cvFiles.length,
      remaining,
      limit,
      used: profile.cvsUsedThisMonth,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { error: "Failed to process ZIP file" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOC, or DOCX." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";

    if (file.type === "application/pdf") {
      // Extract text from PDF using pdf2json
      text = await extractPdfText(buffer);
    } else {
      // Extract text from DOC/DOCX using mammoth
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    const cleanedText = text.trim();

    if (cleanedText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from your file. Please try a different file or paste your CV directly.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: cleanedText,
      fileName: file.name,
      size: file.size,
      characterCount: cleanedText.length,
    });
  } catch (error) {
    console.error("File upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Failed to process your file: ${message}. Please try again or paste your CV directly.`,
      },
      { status: 500 }
    );
  }
}

// Helper function to extract PDF text
async function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    // Dynamic import to avoid build issues
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
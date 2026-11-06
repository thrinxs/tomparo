import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, AlignmentType, BorderStyle,
} from "docx";

// ── helpers ───────────────────────────────────────────────────────────────────

function parseJSON(str: string | null, fallback: any[] = []) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" } },
    spacing: { after: 120 },
    children: [],
  });
}

function sectionTitle(text: string) {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: "1E40AF", allCaps: true })],
  });
}

// ── DOCX ──────────────────────────────────────────────────────────────────────

async function buildDocx(cv: any): Promise<Buffer> {
  const experience    = parseJSON(cv.experience);
  const education     = parseJSON(cv.education);
  const skills        = parseJSON(cv.skills);
  const certifications = parseJSON(cv.certifications);

  const children: Paragraph[] = [];

  // Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: cv.fullName || "Your Name", bold: true, size: 52, color: "111827" })],
    })
  );

  // Contact
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin, cv.website].filter(Boolean);
  if (contactParts.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: contactParts.join("  |  "), size: 18, color: "6B7280" })],
      })
    );
  }

  // AI badge
  if (cv.isAiGenerated) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: "✦ Generated on TomParo AI", size: 16, italics: true, color: "7C3AED" })],
      })
    );
  }

  children.push(divider());

  // Summary
  if (cv.summary) {
    children.push(sectionTitle("Professional Summary"));
    children.push(new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: cv.summary, size: 20, color: "374151" })],
    }));
    children.push(divider());
  }

  // Experience
  if (experience.length) {
    children.push(sectionTitle("Work Experience"));
    for (const exp of experience) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: exp.title || "", bold: true, size: 22, color: "111827" }),
          new TextRun({ text: `  —  ${exp.company || ""}`, size: 20, color: "1E40AF" }),
        ],
      }));
      children.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({
          text: exp.current ? `${exp.from} – Present` : `${exp.from} – ${exp.to}`,
          size: 18, italics: true, color: "6B7280",
        })],
      }));
      if (exp.description) {
        const lines = exp.description.split(/\n/).map((l: string) => l.trim()).filter(Boolean);
        for (const line of lines) {
          children.push(new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: line, size: 20, color: "374151" })],
          }));
        }
      }
      children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
    }
    children.push(divider());
  }

  // Education
  if (education.length) {
    children.push(sectionTitle("Education"));
    for (const edu of education) {
      children.push(new Paragraph({
        spacing: { before: 100, after: 40 },
        children: [
          new TextRun({ text: `${edu.degree || ""}${edu.field ? ` in ${edu.field}` : ""}`, bold: true, size: 22, color: "111827" }),
        ],
      }));
      children.push(new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: edu.school || "", size: 20, color: "1E40AF" }),
          new TextRun({ text: `  (${edu.from} – ${edu.to})`, size: 18, italics: true, color: "6B7280" }),
        ],
      }));
    }
    children.push(divider());
  }

  // Skills
  if (skills.length) {
    children.push(sectionTitle("Skills"));
    children.push(new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: skills.join("  •  "), size: 20, color: "374151" })],
    }));
    children.push(divider());
  }

  // Certifications
  if (certifications.length) {
    children.push(sectionTitle("Certifications"));
    for (const cert of certifications) {
      children.push(new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: cert.name || "", bold: true, size: 20, color: "111827" }),
          new TextRun({ text: `  —  ${cert.issuer || ""}  (${cert.year || ""})`, size: 18, color: "6B7280" }),
        ],
      }));
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 20 } } },
    },
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}

// ── PDF ───────────────────────────────────────────────────────────────────────

async function buildPdf(cv: any): Promise<Buffer> {
  const { default: ReactPDF, Document, Page, Text, View, StyleSheet } =
    await import("@react-pdf/renderer");
  const { createElement: h } = await import("react");

  const experience     = parseJSON(cv.experience);
  const education      = parseJSON(cv.education);
  const skills         = parseJSON(cv.skills);
  const certifications = parseJSON(cv.certifications);

  const s = StyleSheet.create({
    page:        { padding: 40, fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
    name:        { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#111827", textAlign: "center", marginBottom: 4 },
    contact:     { fontSize: 9, color: "#6B7280", textAlign: "center", marginBottom: 4 },
    aiTag:       { fontSize: 8, color: "#7C3AED", textAlign: "center", fontFamily: "Helvetica-Oblique", marginBottom: 10 },
    divider:     { borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginVertical: 8 },
    sectionTitle:{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1E40AF", textTransform: "uppercase", letterSpacing: 1, marginTop: 10, marginBottom: 5 },
    expTitle:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827" },
    expCompany:  { fontSize: 10, color: "#1E40AF" },
    expDate:     { fontSize: 9, color: "#6B7280", fontFamily: "Helvetica-Oblique", marginBottom: 3 },
    bullet:      { fontSize: 10, color: "#374151", marginLeft: 8, marginBottom: 2 },
    summary:     { fontSize: 10, color: "#374151", lineHeight: 1.5 },
    skills:      { fontSize: 10, color: "#374151" },
    eduTitle:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827" },
    eduSub:      { fontSize: 10, color: "#1E40AF" },
    certName:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
    certSub:     { fontSize: 9, color: "#6B7280" },
    mb8:         { marginBottom: 8 },
  });

  const contactLine = [cv.email, cv.phone, cv.location, cv.linkedin, cv.website]
    .filter(Boolean).join("  |  ");

  const MyDoc = h(Document, null,
    h(Page, { size: "A4", style: s.page },

      h(Text, { style: s.name }, cv.fullName || "Your Name"),
      contactLine ? h(Text, { style: s.contact }, contactLine) : null,
      cv.isAiGenerated ? h(Text, { style: s.aiTag }, "✦ Generated on TomParo AI") : null,
      h(View, { style: s.divider }),

      // Summary
      cv.summary ? h(View, null,
        h(Text, { style: s.sectionTitle }, "Professional Summary"),
        h(Text, { style: s.summary }, cv.summary),
        h(View, { style: s.divider }),
      ) : null,

      // Experience
      experience.length ? h(View, null,
        h(Text, { style: s.sectionTitle }, "Work Experience"),
        ...experience.map((exp: any) =>
          h(View, { key: exp.id, style: s.mb8 },
            h(Text, { style: s.expTitle }, exp.title || ""),
            h(Text, { style: s.expCompany }, exp.company || ""),
            h(Text, { style: s.expDate },
              exp.current ? `${exp.from} – Present` : `${exp.from} – ${exp.to}`
            ),
            ...(exp.description || "").split("\n")
              .map((l: string) => l.trim()).filter(Boolean)
              .map((line: string, i: number) =>
                h(Text, { key: i, style: s.bullet }, `• ${line}`)
              ),
          )
        ),
        h(View, { style: s.divider }),
      ) : null,

      // Education
      education.length ? h(View, null,
        h(Text, { style: s.sectionTitle }, "Education"),
        ...education.map((edu: any) =>
          h(View, { key: edu.id, style: s.mb8 },
            h(Text, { style: s.eduTitle },
              `${edu.degree || ""}${edu.field ? ` in ${edu.field}` : ""}`
            ),
            h(Text, { style: s.eduSub },
              `${edu.school || ""}  (${edu.from} – ${edu.to})`
            ),
          )
        ),
        h(View, { style: s.divider }),
      ) : null,

      // Skills
      skills.length ? h(View, null,
        h(Text, { style: s.sectionTitle }, "Skills"),
        h(Text, { style: s.skills }, skills.join("  •  ")),
        h(View, { style: s.divider }),
      ) : null,

      // Certifications
      certifications.length ? h(View, null,
        h(Text, { style: s.sectionTitle }, "Certifications"),
        ...certifications.map((cert: any) =>
          h(View, { key: cert.id, style: s.mb8 },
            h(Text, { style: s.certName }, cert.name || ""),
            h(Text, { style: s.certSub },
              `${cert.issuer || ""}${cert.year ? `  (${cert.year})` : ""}`
            ),
          )
        ),
      ) : null,
    )
  );

  const buffer = await ReactPDF.renderToBuffer(MyDoc as any);
  return buffer as unknown as Buffer;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;
    const format = req.nextUrl.searchParams.get("format") || "docx";

    const cv = await prisma.builtCV.findFirst({ where: { id, userId } });
    if (!cv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const safeName = (cv.fullName || "cv")
      .toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40);

    if (format === "pdf") {
      const pdfBuffer = await buildPdf(cv);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        },
      });
    }

    // Default: docx
    const docxBuffer = await buildDocx(cv);
    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      },
    });
  } catch (err) {
    console.error("CV download error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Download failed" },
      { status: 500 }
    );
  }
}

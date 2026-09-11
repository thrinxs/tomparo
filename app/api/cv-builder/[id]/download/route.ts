import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";

function parseJSON(str: string | null, fallback: any[] = []) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

function buildBasicDoc(cv: any) {
  const experience = parseJSON(cv.experience);
  const education = parseJSON(cv.education);
  const skills = parseJSON(cv.skills);
  const certifications = parseJSON(cv.certifications);

  const children: any[] = [];

  // Name
  children.push(
    new Paragraph({
      text: cv.fullName || "Your Name",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 },
    })
  );

  // Contact line
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin, cv.website].filter(Boolean);
  if (contactParts.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join("  ·  "), size: 20, color: "555555" })],
        spacing: { after: 200 },
      })
    );
  }

  // Summary
  if (cv.summary) {
    children.push(new Paragraph({ text: "PROFESSIONAL SUMMARY", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    children.push(new Paragraph({ text: cv.summary, spacing: { after: 200 } }));
  }

  // Experience
  if (experience.length) {
    children.push(new Paragraph({ text: "WORK EXPERIENCE", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    experience.forEach((exp: any) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.title, bold: true }),
          new TextRun({ text: `  —  ${exp.company}`, color: "555555" }),
        ],
        spacing: { before: 100 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `${exp.from} — ${exp.current ? "Present" : exp.to}`, size: 18, color: "888888" })],
      }));
      if (exp.description) {
        children.push(new Paragraph({ text: exp.description, spacing: { after: 100 } }));
      }
    });
  }

  // Education
  if (education.length) {
    children.push(new Paragraph({ text: "EDUCATION", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    education.forEach((edu: any) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`, bold: true }),
          new TextRun({ text: `  —  ${edu.school}`, color: "555555" }),
        ],
        spacing: { before: 100 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `${edu.from} — ${edu.to}`, size: 18, color: "888888" })],
        spacing: { after: 100 },
      }));
    });
  }

  // Skills
  if (skills.length) {
    children.push(new Paragraph({ text: "SKILLS", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    children.push(new Paragraph({ text: skills.join("  ·  "), spacing: { after: 100 } }));
  }

  // Certifications
  if (certifications.length) {
    children.push(new Paragraph({ text: "CERTIFICATIONS", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    certifications.forEach((cert: any) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: cert.name, bold: true }),
          new TextRun({ text: `  —  ${cert.issuer}  ·  ${cert.year}`, color: "555555" }),
        ],
        spacing: { before: 80 },
      }));
    });
  }

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      children,
    }],
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id } = await params;

    const cv = await prisma.builtCV.findFirst({ where: { id, userId } });
    if (!cv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const doc = buildBasicDoc(cv);
    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);

    const filename = `${(cv.fullName || "CV").replace(/\s+/g, "_")}_CV.docx`;

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("CV download error:", err);
    return NextResponse.json({ error: "Failed to generate CV" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list all batches with groups and file counts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const batches = await prisma.documentBatch.findMany({
      where: { recruiterId: profile.id },
      include: {
        groups: {
          include: { files: { select: { id: true, fileName: true, detectedType: true, typeName: true, confidence: true, candidateId: true, uploadedAt: true } } },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ batches });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

// POST — create a new batch with groups and files
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { name, notes, files } = await req.json();
    // files: Array<{ fileName, detectedType, typeName, confidence, reasoning, rawText, candidateId? }>

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Group files by detectedType
    const grouped: Record<string, typeof files> = {};
    for (const file of files) {
      const type = file.detectedType || "OTHER";
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(file);
    }

    // Create batch
    const batch = await prisma.documentBatch.create({
      data: {
        recruiterId: profile.id,
        name: name || `Upload — ${new Date().toLocaleDateString()}`,
        notes: notes || null,
        totalFiles: files.length,
      },
    });

    // Create groups + files
    for (const [type, groupFiles] of Object.entries(grouped)) {
      const group = await prisma.documentGroup.create({
        data: {
          batchId: batch.id,
          detectedType: type,
          fileCount: groupFiles.length,
        },
      });

      for (const file of groupFiles) {
        await prisma.documentFile.create({
          data: {
            batchId: batch.id,
            groupId: group.id,
            recruiterId: profile.id,
            candidateId: file.candidateId || null,
            fileName: file.fileName,
            detectedType: file.detectedType,
            typeName: file.typeName,
            confidence: file.confidence || 0,
            reasoning: file.reasoning || null,
            rawText: file.rawText ? file.rawText.slice(0, 50000) : null,
          },
        });
      }
    }

    return NextResponse.json({ success: true, batchId: batch.id });
  } catch (error) {
    console.error("Document batch create error:", error);
    return NextResponse.json({ error: "Failed to save documents" }, { status: 500 });
  }
}

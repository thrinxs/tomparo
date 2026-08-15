import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// PATCH — rename a group
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { customName, batchName, batchNotes } = await req.json();

    // Rename group
    if (customName !== undefined) {
      const data: Prisma.DocumentGroupUpdateInput = { customName };
      await prisma.documentGroup.update({ where: { id }, data });
    }

    // Rename batch
    if (batchName !== undefined) {
      const data: Prisma.DocumentBatchUpdateInput = {};
      if (batchName !== undefined) data.name = batchName;
      if (batchNotes !== undefined) data.notes = batchNotes;
      await prisma.documentBatch.update({ where: { id }, data });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE — delete a batch
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.documentBatch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

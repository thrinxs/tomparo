import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { detectDocumentType } from "@/lib/ai/recruiter-cv-analyzer";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { text } = await req.json();
    if (!text || typeof text !== "string") return NextResponse.json({ error: "Text required" }, { status: 400 });

    const detection = await detectDocumentType(text);
    return NextResponse.json({ detection });
  } catch (error) {
    return NextResponse.json({ error: "Detection failed" }, { status: 500 });
  }
}

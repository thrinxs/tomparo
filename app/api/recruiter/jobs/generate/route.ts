import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJSONWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { title } = await req.json();
    if (!title) return NextResponse.json({ error: "Job title is required" }, { status: 400 });

    const prompt = `You are an expert HR professional. Generate a complete job posting for "${title}" at ${profile.companyName}${profile.industry ? ` in the ${profile.industry} industry` : ""}.

Return ONLY valid JSON with no extra text:
{
  "description": "Write 2-3 engaging paragraphs describing the role, company, and opportunity",
  "requirements": "- Requirement 1\n- Requirement 2\n- Requirement 3\n- Requirement 4\n- Requirement 5",
  "location": "Lagos, Nigeria",
  "type": "FULL_TIME",
  "salaryMin": 200000,
  "salaryMax": 400000
}`;

    console.log("🚀 Generating JD for:", title);
    const result = await generateJSONWithGemini<any>(prompt, "general");
    console.log("✅ Generated result:", JSON.stringify(result));

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}

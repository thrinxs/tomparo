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

    const { field, content, title } = await req.json();
    if (!field || !content || !title) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const prompt = `You are an expert HR professional. Review this job ${field} for a "${title}" role at ${profile.companyName}.

Content to review:
${content}

Return ONLY valid JSON:
{
  "score": 75,
  "summary": "One sentence overall verdict",
  "issues": [
    {
      "type": "error",
      "title": "Issue title",
      "detail": "What is wrong and why",
      "fix": "Exact suggested fix"
    }
  ],
  "strengths": [
    "What is good about this content"
  ],
  "improvedContent": "Full rewritten improved version"
}

Rules:
- type must be exactly one of: error, warning, suggestion
- If no issues, return empty array for issues
- improvedContent must always be filled with the best possible version`;

    console.log("🔍 Reviewing field:", field, "for:", title);
    const review = await generateJSONWithGemini<any>(prompt, "general");
    console.log("✅ Review result:", JSON.stringify(review));

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Review field error:", error);
    return NextResponse.json({ error: "Failed to review" }, { status: 500 });
  }
}

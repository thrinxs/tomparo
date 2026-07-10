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

    const { field, title } = await req.json();
    if (!field || !title) return NextResponse.json({ error: "Field and title required" }, { status: 400 });

    let prompt = "";

    if (field === "description") {
      prompt = `Write a compelling 2-3 paragraph job description for a "${title}" role at ${profile.companyName}. Make it engaging, professional, and exciting. Return ONLY valid JSON: { "content": "the full description here" }`;
    } else if (field === "requirements") {
      prompt = `Write clear, specific requirements for a "${title}" role at ${profile.companyName}. Return ONLY valid JSON: { "content": "- Requirement 1\n- Requirement 2\n- Requirement 3\n- Requirement 4\n- Requirement 5\n- Requirement 6" }`;
    } else {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    console.log("🚀 Generating field:", field, "for:", title);
    const result = await generateJSONWithGemini<any>(prompt, "general");
    console.log("✅ Field result:", JSON.stringify(result));

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Generate field error:", error);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}

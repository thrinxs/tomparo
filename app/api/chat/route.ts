import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithAI } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { message, conversationId, cvContext } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        resumes: { orderBy: { createdAt: "desc" }, take: 1 },
        recruiterProfile: true,
      },
    });

    const resumeText = user?.resumes[0]?.rawText || "";
    const profileBio = user?.recruiterProfile?.description || "";

    const systemPrompt = `You are TomParo AI Career Assistant — professional, warm, and helpful.
User Name: ${session.user.name || "User"}
Profile Bio: ${profileBio || "Not provided"}
Resume Summary (first 1500 chars): ${resumeText.substring(0, 1500)}

Rules:
1. If the user asks to generate, create, build, or write a CV or resume:
   - Check if you have enough data (experience, education, skills) from the resume/profile above.
   - If YES: include the exact tag [GENERATE_CV] once at the END of your message, then write a brief confirmation like "I am generating your CV now...".
   - If NO: ask for the missing details (e.g. work experience, skills, target role).
2. For all other messages: give helpful, concise career advice.
3. Never include [GENERATE_CV] unless you are confident you have enough profile data.`;

    const aiResponse = await generateWithAI(
      `${systemPrompt}\n\nUser: ${message}`,
      "chat"
    );

    const hasCvIntent = aiResponse.includes("[GENERATE_CV]");
    const cleanMessage = aiResponse.replace("[GENERATE_CV]", "").trim();

    return NextResponse.json({ message: cleanMessage, hasCvIntent, conversationId });
  } catch (err) {
    console.error("[CHAT_ERROR]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

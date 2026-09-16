import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { companyName } = await req.json();
    if (!companyName)
      return NextResponse.json({ error: "companyName required" }, { status: 400 });

    const prompt = `What is the careers/jobs page URL for "${companyName}"?
Return ONLY the URL, nothing else. No explanation, no markdown.
Example: https://flutterwave.com/ng/careers
If you don't know, return: UNKNOWN`;

    const url = (await generateWithGemini(prompt)).trim();

    if (!url || url === "UNKNOWN" || !url.startsWith("http"))
      return NextResponse.json({ error: "Could not find career page" }, { status: 404 });

    return NextResponse.json({ success: true, url });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

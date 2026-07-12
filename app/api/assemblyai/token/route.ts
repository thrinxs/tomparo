import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { shareToken } = await req.json();

    if (!shareToken) {
      return NextResponse.json({ error: "Share token required" }, { status: 400 });
    }

    // Validate share token against DB — never expose AssemblyAI key without validation
    const interview = await prisma.recruiterInterview.findUnique({
      where: { shareToken },
      select: { id: true, status: true },
    });

    if (!interview) {
      return NextResponse.json({ error: "Invalid interview" }, { status: 404 });
    }

    if (interview.status === "CANCELLED") {
      return NextResponse.json({ error: "Interview cancelled" }, { status: 400 });
    }

    // Get short-lived AssemblyAI token — API key stays server-side only
    const res = await fetch("https://api.assemblyai.com/v2/realtime/token", {
      method: "POST",
      headers: {
        "Authorization": process.env.ASSEMBLYAI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_in: 3600 }),
    });

    if (!res.ok) throw new Error("AssemblyAI token request failed");

    const data = await res.json();
    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error("AssemblyAI token error:", error);
    return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
  }
}

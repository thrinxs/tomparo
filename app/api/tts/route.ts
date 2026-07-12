import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId } = await req.json();
    if (!text || !voiceId) {
      return NextResponse.json({ error: "Missing text or voiceId" }, { status: 400 });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.80,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("ElevenLabs error:", err);
      // Return 402 specifically for quota exceeded so client can fallback gracefully
      return NextResponse.json({ error: "quota_exceeded" }, { status: 402 });
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audio.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}

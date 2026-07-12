import { NextRequest, NextResponse } from "next/server";

// ── Try ElevenLabs ─────────────────────────────────────────────────────────────
async function tryElevenLabs(text: string, voiceId: string): Promise<ArrayBuffer | null> {
  try {
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
      console.warn("ElevenLabs failed:", err);
      return null;
    }
    return await res.arrayBuffer();
  } catch (err) {
    console.warn("ElevenLabs error:", err);
    return null;
  }
}

// ── Try Hugging Face TTS ───────────────────────────────────────────────────────
async function tryHuggingFace(text: string): Promise<ArrayBuffer | null> {
  try {
    // microsoft/speecht5_tts — good quality, fast, free
    const res = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/speecht5_tts",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            // Speaker embedding for clear English voice
            speaker_embeddings: "https://huggingface.co/datasets/Matthijs/cmu-arctic-xvectors/resolve/main/cmu_us_bdl_arctic-wav-arctic_a0009.npy"
          }
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.warn("HuggingFace TTS failed:", err);
      return null;
    }
    return await res.arrayBuffer();
  } catch (err) {
    console.warn("HuggingFace TTS error:", err);
    return null;
  }
}

// ── Main route ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { text, voiceId } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // 1. Try ElevenLabs first
    if (voiceId && process.env.ELEVENLABS_API_KEY) {
      const audio = await tryElevenLabs(text.trim(), voiceId);
      if (audio) {
        return new NextResponse(audio, {
          headers: {
            "Content-Type": "audio/mpeg",
            "X-TTS-Provider": "elevenlabs",
          },
        });
      }
    }

    // 2. Fall back to Hugging Face
    if (process.env.HUGGINGFACE_API_KEY) {
      const audio = await tryHuggingFace(text.trim());
      if (audio) {
        return new NextResponse(audio, {
          headers: {
            "Content-Type": "audio/flac",
            "X-TTS-Provider": "huggingface",
          },
        });
      }
    }

    // 3. Both failed — tell client to use Web Speech API
    return NextResponse.json(
      { error: "tts_unavailable", fallback: "web-speech" },
      { status: 503 }
    );

  } catch (error) {
    console.error("TTS route error:", error);
    return NextResponse.json(
      { error: "tts_unavailable", fallback: "web-speech" },
      { status: 503 }
    );
  }
}

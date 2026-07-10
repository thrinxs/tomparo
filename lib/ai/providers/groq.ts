import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

export async function callGroq(prompt: string): Promise<string> {
  if (!groq) throw new Error("Groq API key not configured");

  console.log("🚀 Calling Groq...");
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful AI. Always respond with valid JSON only, no markdown, no code blocks.",
      },
      { role: "user", content: prompt },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content || "";
  console.log(`✅ Groq responded (${text.length} chars)`);
  return text;
}

// For chat conversations - plain text, no JSON forcing
export async function callGroqChat(prompt: string): Promise<string> {
  if (!groq) throw new Error("Groq API key not configured");

  console.log("💬 Calling Groq (chat mode)...");
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are TomParo AI, a helpful career coach. Respond naturally in a conversational tone. Use markdown formatting (bullets, bold) when helpful. Never respond in JSON format.",
      },
      { role: "user", content: prompt },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 2000,
  });

  const text = completion.choices[0]?.message?.content || "";
  console.log(`✅ Groq chat responded (${text.length} chars)`);
  return text;
}
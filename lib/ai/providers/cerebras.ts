const apiKey = process.env.CEREBRAS_API_KEY;

export async function callCerebras(prompt: string): Promise<string> {
  if (!apiKey) throw new Error("Cerebras API key not configured");

  console.log("⚡ Calling Cerebras...");
  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI. Always respond with valid JSON only, no markdown, no code blocks.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cerebras API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  console.log(`✅ Cerebras responded (${text.length} chars)`);
  return text;
}

// For chat conversations - plain text
export async function callCerebrasChat(prompt: string): Promise<string> {
  if (!apiKey) throw new Error("Cerebras API key not configured");

  console.log("💬 Calling Cerebras (chat mode)...");
  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: "You are TomParo AI, a helpful career coach. Respond naturally in a conversational tone. Use markdown formatting (bullets, bold) when helpful. Never respond in JSON format.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cerebras API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  console.log(`✅ Cerebras chat responded (${text.length} chars)`);
  return text;
}
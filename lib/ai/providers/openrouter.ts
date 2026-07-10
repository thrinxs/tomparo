const apiKey = process.env.OPENROUTER_API_KEY;

export async function callOpenRouter(prompt: string): Promise<string> {
  if (!apiKey) throw new Error("OpenRouter API key not configured");

  console.log("🌐 Calling OpenRouter...");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://www.tomparo.com",
      "X-Title": "TomParo",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI. Always respond with valid JSON only, no markdown, no code blocks.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  console.log(`✅ OpenRouter responded (${text.length} chars)`);
  return text;
}
const apiKey = process.env.MISTRAL_API_KEY;

export async function callMistral(prompt: string): Promise<string> {
  if (!apiKey) throw new Error("Mistral API key not configured");

  console.log("🎭 Calling Mistral...");
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-large-latest",
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
    throw new Error(`Mistral API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  console.log(`✅ Mistral responded (${text.length} chars)`);
  return text;
}
const apiKey = process.env.HUGGINGFACE_API_KEY;

export async function callHuggingFace(prompt: string): Promise<string> {
  if (!apiKey) throw new Error("HuggingFace API key not configured");

  console.log("🤗 Calling HuggingFace...");
  const response = await fetch(
    "https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: `You are a helpful AI. Always respond with valid JSON only, no markdown, no code blocks.\n\n${prompt}`,
        parameters: {
          temperature: 0.3,
          max_new_tokens: 4000,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = Array.isArray(data) ? data[0]?.generated_text || "" : data.generated_text || "";
  console.log(`✅ HuggingFace responded (${text.length} chars)`);
  return text;
}
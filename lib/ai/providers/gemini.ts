import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const primaryModel = genAI?.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 32768,
    responseMimeType: "application/json",
  },
});

const fallbackModel = genAI?.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 32768,
    responseMimeType: "application/json",
  },
});

// Chat models (plain text, not JSON)
const primaryChatModel = genAI?.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2000,
  },
});

const fallbackChatModel = genAI?.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2000,
  },
});

export async function callGemini(prompt: string, useFallback: boolean = false): Promise<string> {
  if (!primaryModel || !fallbackModel) {
    throw new Error("Gemini API key not configured");
  }

  const model = useFallback ? fallbackModel : primaryModel;
  const modelName = useFallback ? "Gemini Flash Lite" : "Gemini Flash";

  console.log(`🤖 Calling ${modelName}...`);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log(`✅ ${modelName} responded (${text.length} chars)`);
  return text;
}

// For chat conversations - plain text
export async function callGeminiChat(prompt: string, useFallback: boolean = false): Promise<string> {
  if (!primaryChatModel || !fallbackChatModel) {
    throw new Error("Gemini API key not configured");
  }

  const model = useFallback ? fallbackChatModel : primaryChatModel;
  const modelName = useFallback ? "Gemini Flash Lite" : "Gemini Flash";

  console.log(`💬 Calling ${modelName} (chat mode)...`);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log(`✅ ${modelName} chat responded (${text.length} chars)`);
  return text;
}
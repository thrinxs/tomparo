import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in .env.local");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.4,
    maxOutputTokens: 16384,
    responseMimeType: "application/json",
  },
});

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  try {
    console.log("Calling Gemini AI...");
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();
    console.log("Gemini responded, length:", text.length);
    return text;
  } catch (error) {
    console.error("Gemini AI error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Invalid Gemini API key.");
      }
      if (error.message.includes("quota")) {
        throw new Error("Gemini API quota exceeded. Try again later.");
      }
      if (error.message.includes("SAFETY")) {
        throw new Error("Content blocked by AI safety filters.");
      }
      throw new Error("Gemini AI error: " + error.message);
    }

    throw new Error("AI generation failed. Please try again.");
  }
}

export async function generateJSONWithGemini<T>(prompt: string): Promise<T> {
  const text = await generateWithGemini(prompt);

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/gi, "");
  cleaned = cleaned.replace(/^```\s*/g, "");
  cleaned = cleaned.replace(/\s*```$/g, "");
  cleaned = cleaned.trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    console.error("No JSON found in response");
    throw new Error("AI response is not valid JSON");
  }

  let jsonString = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonString) as T;
  } catch (firstError) {
    console.warn("First parse failed, attempting to fix JSON");

    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;

    if (openBraces > closeBraces) {
      jsonString = jsonString + "}".repeat(openBraces - closeBraces);
    }

    jsonString = jsonString.replace(/,\s*}/g, "}");
    jsonString = jsonString.replace(/,\s*\]/g, "]");

    try {
      return JSON.parse(jsonString) as T;
    } catch (secondError) {
      console.error("Failed to parse Gemini response");
      throw new Error("AI response was cut off. Try again with shorter input.");
    }
  }
}
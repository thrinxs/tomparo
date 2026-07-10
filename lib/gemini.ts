import { callGemini, callGeminiChat } from "./ai/providers/gemini";
import { callGroq, callGroqChat } from "./ai/providers/groq";
import { callCerebras, callCerebrasChat } from "./ai/providers/cerebras";
import { callMistral } from "./ai/providers/mistral";
import { callOpenRouter } from "./ai/providers/openrouter";
import { callHuggingFace } from "./ai/providers/huggingface";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface AIProvider {
  name: string;
  call: (prompt: string) => Promise<string>;
  dailyLimit: number;
  speed: "ultra-fast" | "fast" | "medium" | "slow";
  bestFor: string[];
}

// All available providers (JSON mode)
const allProviders: Record<string, AIProvider> = {
  groq: {
    name: "Groq",
    call: callGroq,
    dailyLimit: 14400,
    speed: "ultra-fast",
    bestFor: ["chat", "interview", "quick-analysis"],
  },
  cerebras: {
    name: "Cerebras",
    call: callCerebras,
    dailyLimit: 8000,
    speed: "ultra-fast",
    bestFor: ["chat", "quick-analysis"],
  },
  geminiFlash: {
    name: "Gemini Flash",
    call: (p) => callGemini(p, false),
    dailyLimit: 250,
    speed: "fast",
    bestFor: ["cv-analysis", "career-analysis", "complex-json"],
  },
  geminiLite: {
    name: "Gemini Flash Lite",
    call: (p) => callGemini(p, true),
    dailyLimit: 1000,
    speed: "fast",
    bestFor: ["cv-analysis", "career-analysis"],
  },
  mistral: {
    name: "Mistral",
    call: callMistral,
    dailyLimit: 5000,
    speed: "medium",
    bestFor: ["general", "multilingual"],
  },
  openrouter: {
    name: "OpenRouter",
    call: callOpenRouter,
    dailyLimit: 5000,
    speed: "medium",
    bestFor: ["general"],
  },
  huggingface: {
    name: "HuggingFace",
    call: callHuggingFace,
    dailyLimit: 1000,
    speed: "slow",
    bestFor: ["last-resort"],
  },
};

// Chat providers (plain text mode)
const chatProviders: Record<string, AIProvider> = {
  groq: {
    name: "Groq (chat)",
    call: callGroqChat,
    dailyLimit: 14400,
    speed: "ultra-fast",
    bestFor: ["chat"],
  },
  cerebras: {
    name: "Cerebras (chat)",
    call: callCerebrasChat,
    dailyLimit: 8000,
    speed: "ultra-fast",
    bestFor: ["chat"],
  },
  geminiFlash: {
    name: "Gemini Flash (chat)",
    call: (p) => callGeminiChat(p, false),
    dailyLimit: 250,
    speed: "fast",
    bestFor: ["chat"],
  },
  geminiLite: {
    name: "Gemini Flash Lite (chat)",
    call: (p) => callGeminiChat(p, true),
    dailyLimit: 1000,
    speed: "fast",
    bestFor: ["chat"],
  },
};

export type TaskType =
  | "cv-analysis"
  | "job-match"
  | "career-analysis"
  | "cover-letter"
  | "email"
  | "skill-gap"
  | "interview-questions"
  | "interview-evaluation"
  | "chat"
  | "general";

const taskProviderOrder: Record<TaskType, string[]> = {
  "cv-analysis": ["geminiFlash", "geminiLite", "groq", "cerebras", "mistral", "openrouter", "huggingface"],
  "job-match": ["geminiFlash", "geminiLite", "groq", "cerebras", "mistral", "openrouter", "huggingface"],
  "career-analysis": ["geminiFlash", "geminiLite", "groq", "cerebras", "mistral", "openrouter", "huggingface"],
  "cover-letter": ["geminiFlash", "groq", "cerebras", "geminiLite", "mistral", "openrouter", "huggingface"],
  "email": ["groq", "cerebras", "geminiFlash", "geminiLite", "mistral", "openrouter", "huggingface"],
  "skill-gap": ["geminiFlash", "geminiLite", "groq", "cerebras", "mistral", "openrouter", "huggingface"],
  "interview-questions": ["groq", "cerebras", "geminiFlash", "geminiLite", "mistral", "openrouter", "huggingface"],
  "interview-evaluation": ["geminiFlash", "groq", "cerebras", "geminiLite", "mistral", "openrouter", "huggingface"],
  "chat": ["groq", "cerebras", "geminiLite", "geminiFlash"],
  "general": ["groq", "cerebras", "geminiFlash", "geminiLite", "mistral", "openrouter", "huggingface"],
};

export async function generateWithAI(
  prompt: string,
  taskType: TaskType = "general"
): Promise<string> {
  const order = taskProviderOrder[taskType];
  const errors: string[] = [];

  // Use chat providers for chat, JSON providers for everything else
  const providers = taskType === "chat" ? chatProviders : allProviders;

  console.log(`🎯 Task: ${taskType} | Provider order: ${order.join(" → ")}`);

  for (let i = 0; i < order.length; i++) {
    const providerKey = order[i];
    const provider = providers[providerKey];

    if (!provider) continue;

    try {
      const result = await provider.call(prompt);

      if (result && result.length > 10) {
        console.log(`🎉 Success with ${provider.name}!`);
        return result;
      }

      throw new Error("Empty response");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.warn(`⚠️ ${provider.name} failed: ${msg}`);
      errors.push(`${provider.name}: ${msg}`);

      if (i < order.length - 1) {
        await sleep(500);
      }
    }
  }

  console.error(`❌ ALL providers failed for task: ${taskType}`);
  console.error("Errors:", errors);

  throw new Error(
    "All AI services are temporarily unavailable. Please try again in a few minutes."
  );
}

export async function generateWithGemini(prompt: string): Promise<string> {
  return generateWithAI(prompt, "general");
}

export async function generateJSONWithGemini<T>(
  prompt: string,
  taskType: TaskType = "general"
): Promise<T> {
  const text = await generateWithAI(prompt, taskType);

  console.log("📄 Response length:", text.length);

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/gi, "");
  cleaned = cleaned.replace(/^```\s*/g, "");
  cleaned = cleaned.replace(/\s*```$/g, "");
  cleaned = cleaned.trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1) {
    console.error("❌ No opening brace found");
    throw new Error("AI response is not valid JSON");
  }

  let jsonString: string;

  if (lastBrace > firstBrace) {
    jsonString = cleaned.slice(firstBrace, lastBrace + 1);
  } else {
    jsonString = cleaned.slice(firstBrace);
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (firstError) {
    console.warn("⚠️ First parse failed, attempting to fix JSON");

    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;
    const openBrackets = (jsonString.match(/\[/g) || []).length;
    const closeBrackets = (jsonString.match(/\]/g) || []).length;

    let attempts = [
      jsonString,
      jsonString + "}",
      jsonString + "}]}",
      jsonString + "]}}",
    ];

    if (openBrackets > closeBrackets) {
      attempts.push(
        jsonString +
          "]".repeat(openBrackets - closeBrackets) +
          "}".repeat(openBraces - closeBraces)
      );
    }

    if (openBraces > closeBraces) {
      attempts.push(jsonString + "}".repeat(openBraces - closeBraces));
    }

    attempts = attempts.map((s) =>
      s.replace(/,\s*}/g, "}").replace(/,\s*\]/g, "]")
    );

    for (const attempt of attempts) {
      try {
        return JSON.parse(attempt) as T;
      } catch {
        continue;
      }
    }

    console.error("❌ All parse attempts failed");
    throw new Error("AI response format was invalid. Please try again.");
  }
}
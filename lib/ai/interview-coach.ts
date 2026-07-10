import { generateJSONWithGemini } from "@/lib/gemini";

export type QuestionType = "hr" | "technical" | "behavioral" | "mixed";
export type Difficulty = "quick" | "standard" | "full";

export interface InterviewQuestion {
  id: string;
  question: string;
  category: "hr" | "technical" | "behavioral";
  tips: string;
  timeToAnswer: string;
}

export interface QuestionsResult {
  questions: InterviewQuestion[];
  totalQuestions: number;
  estimatedDuration: string;
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  improvedAnswer: string;
  scoreBreakdown: {
    relevance: number;
    clarity: number;
    specificity: number;
    structure: number;
  };
}

const questionCounts: Record<Difficulty, number> = {
  quick: 5,
  standard: 15,
  full: 30,
};

const durationEstimates: Record<Difficulty, string> = {
  quick: "10-15 minutes",
  standard: "30-45 minutes",
  full: "60-90 minutes",
};

export async function generateInterviewQuestions(
  resumeText: string,
  jobDescription: string | undefined,
  questionType: QuestionType,
  difficulty: Difficulty
): Promise<QuestionsResult> {
  const count = questionCounts[difficulty];
  const trimmedResume = resumeText.slice(0, 5000);
  const trimmedJob = jobDescription ? jobDescription.slice(0, 2000) : "";

  const typeInstruction =
    questionType === "mixed"
      ? "Generate a mix of HR, Technical, and Behavioral questions"
      : `Generate only ${questionType.toUpperCase()} questions`;

  const prompt = `You are an expert interview coach. Generate ${count} realistic interview questions.

CANDIDATE RESUME:
${trimmedResume}

${jobDescription ? `TARGET JOB:\n${trimmedJob}` : "GENERAL INTERVIEW (no specific job)"}

${typeInstruction}.

Return ONLY valid JSON:

{
  "questions": [
    {
      "id": "q1",
      "question": "Tell me about a time you had to solve a difficult problem at work.",
      "category": "behavioral",
      "tips": "Use the STAR method: Situation, Task, Action, Result. Focus on YOUR specific role.",
      "timeToAnswer": "2-3 minutes"
    }
  ],
  "totalQuestions": ${count},
  "estimatedDuration": "${durationEstimates[difficulty]}"
}

RULES:
- Generate EXACTLY ${count} questions
- Questions should be RELEVANT to the candidate's background
- Progressively challenging (easier first, harder later)
- Category MUST be one of: "hr", "technical", "behavioral"
- Tips should be actionable (1-2 sentences)
- Time to answer: "1-2 minutes" for simple, "3-5 minutes" for complex
- Return ONLY valid JSON`;

return generateJSONWithGemini<QuestionsResult>(prompt, "interview-questions");
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  category: string,
  jobContext?: string
): Promise<AnswerEvaluation> {
  const trimmedAnswer = answer.slice(0, 3000);
  const trimmedContext = jobContext ? jobContext.slice(0, 1000) : "";

  const prompt = `You are an expert interview evaluator. Score this answer honestly.

QUESTION (${category}):
${question}

CANDIDATE'S ANSWER:
${trimmedAnswer}

${jobContext ? `JOB CONTEXT:\n${trimmedContext}` : ""}

Return ONLY valid JSON:

{
  "score": 75,
  "feedback": "Your answer demonstrates good structure but could benefit from more specific examples...",
  "strengths": [
    "Clear communication",
    "Good use of STAR method"
  ],
  "improvements": [
    "Add specific metrics",
    "Show measurable impact"
  ],
  "improvedAnswer": "Here's a stronger version: In my previous role at XYZ Company, I noticed our team was struggling with...",
  "scoreBreakdown": {
    "relevance": 80,
    "clarity": 75,
    "specificity": 65,
    "structure": 80
  }
}

SCORING GUIDE (0-100):
- 90-100: Excellent — Ready for top companies
- 75-89: Strong — Well-prepared candidate  
- 60-74: Good — Some improvements needed
- 40-59: Fair — Significant improvements needed
- 0-39: Poor — Major restructuring needed

RULES:
- Be honest but constructive
- Score based on: Relevance (25%), Clarity (25%), Specificity (25%), Structure (25%)
- Provide 2-4 strengths and 2-4 improvements
- The improvedAnswer should be a REALISTIC better version they could give
- Return ONLY valid JSON`;

return generateJSONWithGemini<AnswerEvaluation>(prompt, "interview-evaluation");
}
import { generateJSONWithGemini } from "@/lib/gemini";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GeneratedQuestion {
  question: string;
  questionType: "CV_VERIFICATION" | "LOCATION_BASED" | "JOB_SPECIFIC" | "BEHAVIOURAL";
  order: number;
}

export interface GenerateQuestionsInput {
  candidateName: string;
  candidateLocation?: string;
  jobTitle?: string;
  jobDescription?: string;
  cvSummary?: string;
  topSkills?: string[];
  experience?: string;
  education?: string;
  currentRole?: string;
  redFlags?: string[];
}

export interface ScoreAnswerInput {
  question: string;
  questionType: string;
  candidateAnswer: string;
  jobTitle?: string;
  candidateName?: string;
}

export interface ScoreAnswerResult {
  score: number;
  feedback: string;
}

export interface FinalSummaryInput {
  candidateName: string;
  jobTitle?: string;
  questions: {
    question: string;
    questionType: string;
    candidateAnswer?: string;
    aiScore?: number;
    aiFeedback?: string;
  }[];
}

export interface FinalSummaryResult {
  summary: string;
  finalScore: number;
  finalRecommendation: string;
  strengths: string[];
  concerns: string[];
}

// ── Helper — extract array from any AI response shape ─────────────────────────

function extractArray(result: any): any[] | null {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object") {
    // Check common wrapper keys
    for (const key of ["questions", "data", "items", "results", "list"]) {
      if (Array.isArray(result[key])) return result[key];
    }
    // Check any key that is an array
    for (const key of Object.keys(result)) {
      if (Array.isArray(result[key])) return result[key];
    }
  }
  return null;
}

// ── Generate Questions ─────────────────────────────────────────────────────────

export async function generateInterviewQuestions(
  input: GenerateQuestionsInput
): Promise<GeneratedQuestion[]> {
  const {
    candidateName,
    candidateLocation,
    jobTitle,
    jobDescription,
    cvSummary,
    topSkills,
    experience,
    education,
    currentRole,
    redFlags,
  } = input;

  const prompt = `You are an expert recruiter conducting a professional job interview.

Generate exactly 10 interview questions for the following candidate and role.

CANDIDATE PROFILE:
- Name: ${candidateName}
- Current Role: ${currentRole || "Not specified"}
- Location: ${candidateLocation || "Not specified"}
- Experience: ${experience || "Not specified"}
- Education: ${education || "Not specified"}
- Top Skills: ${topSkills?.join(", ") || "Not specified"}
- CV Summary: ${cvSummary || "Not provided"}
${redFlags?.length ? `- Red Flags to probe: ${redFlags.join(", ")}` : ""}

JOB DETAILS:
- Job Title: ${jobTitle || "Not specified"}
- Job Description: ${jobDescription ? jobDescription.slice(0, 500) : "Not provided"}

QUESTION DISTRIBUTION (must follow exactly):
- 3 questions of type CV_VERIFICATION: Verify specific claims on the CV. Reference real details from their CV. Make them prove what they listed.
- 2 questions of type LOCATION_BASED: Ask about their location (${candidateLocation || "their area"}). Include questions about local market knowledge, commute/remote expectations, or regional industry context.
- 3 questions of type JOB_SPECIFIC: Based directly on the job requirements. Test their ability to do this specific job.
- 2 questions of type BEHAVIOURAL: Situational and culture fit questions. Use STAR format prompts.

RULES:
- Questions must be specific, not generic
- CV_VERIFICATION questions must reference actual details from the CV
- Do not number the questions in the text
- Be professional and respectful

Return ONLY a valid JSON array of exactly 10 objects with NO additional text or explanation:
[
  {
    "question": "the full question text",
    "questionType": "CV_VERIFICATION",
    "order": 1
  },
  ...
]`;

  const result = await generateJSONWithGemini<any>(prompt, "general");

  // Try to extract array from whatever shape AI returned
  const questions = extractArray(result);

  if (!questions || questions.length === 0) {
    throw new Error("Failed to generate interview questions");
  }

  // Ensure order is set correctly and types are valid
  const validTypes = ["CV_VERIFICATION", "LOCATION_BASED", "JOB_SPECIFIC", "BEHAVIOURAL"];
  return questions.map((q: any, i: number) => ({
    question: q.question || `Question ${i + 1}`,
    questionType: validTypes.includes(q.questionType) ? q.questionType : "BEHAVIOURAL",
    order: i + 1,
  }));
}

// ── Score Answer ───────────────────────────────────────────────────────────────

export async function scoreInterviewAnswer(
  input: ScoreAnswerInput
): Promise<ScoreAnswerResult> {
  const { question, questionType, candidateAnswer, jobTitle, candidateName } = input;

  const prompt = `You are an expert recruiter evaluating a candidate's interview answer.

CONTEXT:
- Candidate: ${candidateName || "Candidate"}
- Job: ${jobTitle || "the position"}
- Question Type: ${questionType}

QUESTION:
${question}

CANDIDATE'S ANSWER:
${candidateAnswer}

Evaluate this answer. Return ONLY a JSON object with no additional text:
{
  "score": <integer 0-10>,
  "feedback": "<2-3 sentences of specific constructive feedback>"
}

SCORING GUIDE:
- 9-10: Exceptional — detailed, specific, demonstrates clear expertise
- 7-8: Good — solid answer with relevant detail, minor gaps
- 5-6: Average — adequate but vague or missing key details
- 3-4: Below average — weak, off-topic, or raises concerns
- 0-2: Poor — no answer, completely irrelevant, or very concerning

Be fair but honest. Feedback should be actionable and professional.`;

  const result = await generateJSONWithGemini<ScoreAnswerResult>(prompt, "general");

  return {
    score: Math.min(10, Math.max(0, Math.round(result?.score || 0))),
    feedback: result?.feedback || "No feedback available.",
  };
}

// ── Generate Final Summary ─────────────────────────────────────────────────────

export async function generateInterviewSummary(
  input: FinalSummaryInput
): Promise<FinalSummaryResult> {
  const { candidateName, jobTitle, questions } = input;

  const answeredQuestions = questions.filter((q) => q.candidateAnswer);
  const avgScore =
    answeredQuestions.length > 0
      ? Math.round(
          answeredQuestions.reduce((sum, q) => sum + (q.aiScore || 0), 0) /
            answeredQuestions.length
        )
      : 0;

  const questionsText = questions
    .map(
      (q, i) =>
        `Q${i + 1} [${q.questionType}] Score: ${q.aiScore ?? "N/A"}/10
Question: ${q.question}
Answer: ${q.candidateAnswer || "No answer provided"}
Feedback: ${q.aiFeedback || "N/A"}`
    )
    .join("\n\n");

  const prompt = `You are a senior recruiter writing a final interview evaluation.

CANDIDATE: ${candidateName}
ROLE: ${jobTitle || "the position"}
AVERAGE SCORE: ${avgScore}/10
QUESTIONS ANSWERED: ${answeredQuestions.length} of ${questions.length}

INTERVIEW TRANSCRIPT:
${questionsText}

Write a comprehensive final evaluation. Return ONLY a JSON object with no additional text:
{
  "summary": "<3-4 paragraph professional summary of interview performance>",
  "finalScore": <overall score 0-100>,
  "finalRecommendation": "Strong Hire" or "Hire" or "Maybe" or "No Hire",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "concerns": ["<concern 1>", "<concern 2>"]
}

RECOMMENDATION GUIDE:
- Strong Hire: avgScore 8-10, demonstrated clear fit
- Hire: avgScore 6-7, good overall with minor gaps
- Maybe: avgScore 4-5, mixed performance
- No Hire: avgScore 0-3, significant gaps or concerns`;

  const result = await generateJSONWithGemini<FinalSummaryResult>(prompt, "general");

  return {
    summary: result?.summary || "Interview completed.",
    finalScore: Math.min(100, Math.max(0, Math.round(result?.finalScore || avgScore * 10))),
    finalRecommendation: result?.finalRecommendation || "Maybe",
    strengths: Array.isArray(result?.strengths) ? result.strengths : [],
    concerns: Array.isArray(result?.concerns) ? result.concerns : [],
  };
}

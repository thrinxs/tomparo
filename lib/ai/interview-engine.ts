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

// ── ElevenLabs Voice Library ───────────────────────────────────────────────────

export const ELEVENLABS_VOICES = [
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", desc: "Deep, Resonant and Comforting", gender: "male" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", desc: "Steady Broadcaster", gender: "male" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", desc: "Warm, Captivating Storyteller", gender: "male" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", desc: "Smooth, Trustworthy", gender: "male" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", desc: "Charming, Down-to-Earth", gender: "male" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", desc: "Dominant, Firm", gender: "male" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", desc: "Wise, Mature, Balanced", gender: "male" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", desc: "Laid-Back, Casual, Resonant", gender: "male" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", desc: "Deep, Confident, Energetic", gender: "male" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", desc: "Relaxed Optimist", gender: "male" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", desc: "Energetic, Social Media Creator", gender: "male" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", desc: "Mature, Reassuring, Confident", gender: "female" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", desc: "Knowledgable, Professional", gender: "female" },
  { id: "hpp4J3VqNfWAUOO0d1Us", name: "Bella", desc: "Professional, Bright, Warm", gender: "female" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", desc: "Playful, Bright, Warm", gender: "female" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", desc: "Clear, Engaging Educator", gender: "female" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", desc: "Enthusiast, Quirky Attitude", gender: "female" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", desc: "Velvety Actress", gender: "female" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", desc: "Relaxed, Neutral, Informative", gender: "neutral" },
];

export const DEFAULT_MALE_VOICE_ID = "nPczCjzI2devNBz1zQrb"; // Brian
export const DEFAULT_FEMALE_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah
export const DEFAULT_NEUTRAL_VOICE_ID = "SAz9YHcvj6GT2YYXdXww"; // River

// ── Follow-Up Question Engine ──────────────────────────────────────────────────

export interface FollowUpDecision {
  shouldAsk: boolean;
  reason: string;
  suggestedTopic: string;
}

export interface FollowUpQuestion {
  question: string;
  naturalOpener: string;
}

export async function analyzeForFollowUp(input: {
  question: string;
  questionType: string;
  candidateAnswer: string;
  jobTitle?: string;
  candidateName?: string;
  followUpCount: number;
}): Promise<FollowUpDecision> {
  const { question, questionType, candidateAnswer, jobTitle, candidateName, followUpCount } = input;

  if (followUpCount >= 3) return { shouldAsk: false, reason: "Max follow-ups reached", suggestedTopic: "" };
  if (candidateAnswer.trim().split(" ").length < 15) return { shouldAsk: false, reason: "Answer too short to follow up on", suggestedTopic: "" };

  const prompt = `You are an expert interviewer evaluating whether a candidate's answer warrants a natural follow-up question.

CONTEXT:
- Candidate: ${candidateName || "the candidate"}
- Job: ${jobTitle || "the position"}
- Question type: ${questionType}
- Follow-ups already asked this interview: ${followUpCount} (max 3)

INTERVIEW QUESTION:
${question}

CANDIDATE'S ANSWER:
${candidateAnswer}

Analyze the answer and decide if a follow-up would add value. Follow-up is warranted when:
- Candidate mentioned a specific achievement, tool, technology, or project worth exploring
- Answer was vague or generic where specifics would reveal true competence
- Candidate made an interesting claim that deserves verification
- A key aspect of the answer could reveal much more about their expertise

Follow-up is NOT warranted when:
- Answer was already comprehensive and specific
- Question was already answered fully
- Answer revealed clear expertise without gaps

Return ONLY a JSON object:
{
  "shouldAsk": true or false,
  "reason": "brief reason why or why not",
  "suggestedTopic": "what to ask about if shouldAsk is true, empty string if false"
}`;

  const result = await generateJSONWithGemini<FollowUpDecision>(prompt, "general");
  return {
    shouldAsk: result?.shouldAsk || false,
    reason: result?.reason || "",
    suggestedTopic: result?.suggestedTopic || "",
  };
}

export async function generateFollowUpQuestion(input: {
  question: string;
  candidateAnswer: string;
  suggestedTopic: string;
  jobTitle?: string;
  candidateName?: string;
}): Promise<FollowUpQuestion> {
  const { question, candidateAnswer, suggestedTopic, jobTitle, candidateName } = input;

  const prompt = `You are a warm, natural human interviewer. Based on the candidate's answer, write ONE follow-up question that feels completely natural — like something a real human interviewer would say.

CONTEXT:
- Candidate: ${candidateName || "the candidate"}
- Job: ${jobTitle || "the position"}
- Topic to explore: ${suggestedTopic}

ORIGINAL QUESTION:
${question}

CANDIDATE'S ANSWER:
${candidateAnswer}

Write a follow-up that:
- Sounds completely natural and human — NOT robotic or formulaic
- References something SPECIFIC the candidate just said
- Opens with a natural acknowledgement (e.g. "That's interesting...", "I see...", "You mentioned...", "Right, so...", "Okay, and...")
- Is ONE focused question — not multiple questions
- Feels like natural conversation, not an interrogation
- Is warm and encouraging in tone

Return ONLY a JSON object:
{
  "naturalOpener": "The opening acknowledgement only (e.g. 'That's really interesting.')",
  "question": "The full follow-up question text including the opener"
}`;

  const result = await generateJSONWithGemini<FollowUpQuestion>(prompt, "general");
  return {
    question: result?.question || `Can you tell me more about that?`,
    naturalOpener: result?.naturalOpener || "That's interesting.",
  };
}

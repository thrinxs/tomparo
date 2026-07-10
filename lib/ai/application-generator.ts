import { generateJSONWithGemini } from "@/lib/gemini";

export interface CoverLetterResult {
  coverLetter: string;
  wordCount: number;
  qualityScore: number;
  keyHighlights: string[];
  tone: string;
}

export interface EmailResult {
  subject: string;
  email: string;
  wordCount: number;
  qualityScore: number;
  tone: string;
  keyPoints: string[];
}

export type EmailStyle = "formal" | "modern" | "concise";

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string
): Promise<CoverLetterResult> {
  // Trim inputs to avoid token overflow
  const trimmedResume = resumeText.slice(0, 8000);
  const trimmedJob = jobDescription.slice(0, 4000);

  const prompt = `You are an expert cover letter writer. Write a compelling cover letter for this candidate.

RESUME:
${trimmedResume}

JOB DESCRIPTION:
${trimmedJob}

Return ONLY valid JSON in this exact format (no markdown, no code blocks):

{
  "coverLetter": "Dear Hiring Manager,\\n\\n[opening paragraph]\\n\\n[experience paragraph]\\n\\n[value paragraph]\\n\\n[closing paragraph]\\n\\nSincerely,\\n[Candidate Name]",
  "wordCount": 300,
  "qualityScore": 85,
  "keyHighlights": ["highlight 1", "highlight 2", "highlight 3"],
  "tone": "professional"
}

RULES:
- 250-350 words total
- 3-4 paragraphs
- Start with a hook, NOT "I am writing to apply"
- Include specific achievements
- Match the company's tone
- End with "Sincerely,\\n[Name from resume]"
- Use \\n for line breaks in the coverLetter field
- Return ONLY the JSON object, nothing else`;

return generateJSONWithGemini<CoverLetterResult>(prompt, "cover-letter");
}

export async function generateApplicationEmail(
  resumeText: string,
  jobDescription: string,
  style: EmailStyle
): Promise<EmailResult> {
  const trimmedResume = resumeText.slice(0, 6000);
  const trimmedJob = jobDescription.slice(0, 3000);

  const styleGuide = {
    formal: "Traditional corporate tone. Formal salutations. Length: 200 words max.",
    modern: "Professional but friendly. Can use 'Hi'. Length: 150 words max.",
    concise: "Brief and direct. Every word matters. Length: 100 words max.",
  };

  const prompt = `You are an expert email writer. Write a ${style} application email.

RESUME:
${trimmedResume}

JOB DESCRIPTION:
${trimmedJob}

STYLE: ${styleGuide[style]}

Return ONLY valid JSON in this exact format (no markdown, no code blocks):

{
  "subject": "clear subject line with name and role",
  "email": "email body with \\n for line breaks",
  "wordCount": 150,
  "qualityScore": 85,
  "tone": "professional",
  "keyPoints": ["point 1", "point 2", "point 3"]
}

RULES:
- Subject: 40-60 characters, include role and candidate name
- Email: Follow the style length requirement STRICTLY
- Use \\n for line breaks in email field
- Sign with candidate's name from resume
- Return ONLY the JSON object, nothing else`;

return generateJSONWithGemini<EmailResult>(prompt, "email");
}
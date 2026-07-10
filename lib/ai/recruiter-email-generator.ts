import { generateJSONWithGemini } from "@/lib/gemini";

export type EmailType = "interview_invite" | "rejection" | "offer" | "followup" | "waitlist";

export async function generateRecruiterEmail({
  type,
  candidateName,
  jobTitle,
  companyName,
  candidateSummary,
  extraContext,
}: {
  type: EmailType;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  candidateSummary?: string;
  extraContext?: string;
}): Promise<any> {
  const typePrompts: Record<EmailType, string> = {
    interview_invite: `Write a warm, professional interview invitation email for ${candidateName} who applied for ${jobTitle} at ${companyName}. Express genuine interest in their profile. The email should feel personal, not templated.`,
    rejection: `Write a kind, respectful rejection email for ${candidateName} who applied for ${jobTitle} at ${companyName}. Be empathetic, brief, and encouraging. Do not be robotic or generic. Leave them feeling good about the company.`,
    offer: `Write an exciting job offer email for ${candidateName} for the ${jobTitle} position at ${companyName}. Be warm, celebratory, and professional. Make them feel genuinely wanted.`,
    followup: `Write a friendly follow-up email to ${candidateName} regarding their application for ${jobTitle} at ${companyName}. Check in, show continued interest, and invite a response.`,
    waitlist: `Write a considerate waitlist email to ${candidateName} who applied for ${jobTitle} at ${companyName}. Keep their interest alive while being honest that the role is filled for now.`,
  };

  const prompt = `You are an expert HR professional writing a recruitment email.

Context:
- Candidate: ${candidateName}
- Role: ${jobTitle}
- Company: ${companyName}
${candidateSummary ? `- Candidate profile: ${candidateSummary}` : ""}
${extraContext ? `- Additional context: ${extraContext}` : ""}

Task: ${typePrompts[type]}

Return ONLY valid JSON:
{
  "subject": "Email subject line",
  "message": "Full email body — professional, warm, personalized. Use line breaks (\\n\\n) between paragraphs. Do NOT include greeting or sign-off — those are added separately.",
  "tone": "warm | professional | celebratory | empathetic",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
}`;

  return await generateJSONWithGemini<any>(prompt, "general");
}

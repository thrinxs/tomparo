import { generateJSONWithGemini } from "@/lib/gemini";

// ── Generate full JD from title ────────────────────────────────────────────────

export async function generateJobDescription(
  title: string,
  companyName: string,
  industry?: string
): Promise<any> {
  const prompt = `You are an expert HR professional and job description writer. Generate a complete professional job description.

Job Title: ${title}
Company: ${companyName}
Industry: ${industry || "General"}

Return ONLY valid JSON:
{
  "title": "${title}",
  "description": "2-3 paragraph engaging job description that sells the role",
  "requirements": "Bullet point requirements, one per line starting with -",
  "responsibilities": "Key responsibilities, one per line starting with -",
  "benefits": "Benefits offered, one per line starting with -",
  "suggestedSalaryMin": 200000,
  "suggestedSalaryMax": 400000,
  "suggestedLocation": "Lagos, Nigeria",
  "suggestedType": "FULL_TIME"
}`;

  return await generateJSONWithGemini<any>(prompt, "cv-analysis");
}

// ── Generate content for a specific field only ─────────────────────────────────

export async function generateJobField(
  field: string,
  title: string,
  companyName: string,
  existingContext: string
): Promise<any> {
  const fieldPrompts: Record<string, string> = {
    title: `Suggest 5 professional and specific job title variations for: "${title}" at ${companyName}. Return JSON: { "suggestions": ["title1", "title2", "title3", "title4", "title5"] }`,
    description: `Write a compelling 2-3 paragraph job description for "${title}" at ${companyName}. Make it engaging and professional. Return JSON: { "content": "the description here" }`,
    requirements: `Write clear requirements for a "${title}" role at ${companyName}. Return JSON: { "content": "- Requirement 1\n- Requirement 2\n- Requirement 3\n- Requirement 4\n- Requirement 5" }`,
  };

  const prompt = fieldPrompts[field] || fieldPrompts.description;
  return await generateJSONWithGemini<any>(prompt, "cv-analysis");
}

// ── Review a specific field ────────────────────────────────────────────────────

export async function reviewJobField(
  field: string,
  content: string,
  title: string,
  companyName: string
): Promise<any> {
  const prompt = `You are an expert HR professional. Review this job ${field} for "${title}" at ${companyName}.

Content to review:
${content}

Return ONLY valid JSON:
{
  "score": 75,
  "summary": "One sentence overall assessment",
  "issues": [
    {
      "type": "error",
      "title": "Issue title",
      "detail": "What is wrong",
      "fix": "Exact suggested fix"
    }
  ],
  "strengths": ["What is good"],
  "improvedContent": "Full rewritten and improved version of the content"
}

Issue types must be exactly: "error", "warning", or "suggestion".
If no issues found, return empty issues array.`;

  return await generateJSONWithGemini<any>(prompt, "cv-analysis");
}

// ── Review entire job posting at once ─────────────────────────────────────────

export async function reviewFullJobPosting(
  title: string,
  description: string,
  requirements: string,
  companyName: string
): Promise<any> {
  const prompt = `You are an expert HR professional. Review this complete job posting for "${title}" at ${companyName}.

Description:
${description}

Requirements:
${requirements}

Return ONLY valid JSON:
{
  "overallScore": 75,
  "overallFeedback": "2 sentence overall assessment",
  "descriptionIssues": [
    {
      "type": "error",
      "title": "Issue title",
      "detail": "What is wrong",
      "fix": "Exact fix"
    }
  ],
  "requirementsIssues": [
    {
      "type": "warning",
      "title": "Issue title",
      "detail": "What is wrong",
      "fix": "Exact fix"
    }
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "improvedDescription": "Full improved description",
  "improvedRequirements": "Full improved requirements",
  "readabilityScore": 80,
  "clarityScore": 75,
  "completenessScore": 70
}

Issue types must be exactly: "error", "warning", or "suggestion".`;

  return await generateJSONWithGemini<any>(prompt, "cv-analysis");
}
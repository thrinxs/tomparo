import { generateJSONWithGemini } from "@/lib/gemini";

export interface ResumeAnalysisResult {
  atsScore: number;
  scoreLabel: "Excellent" | "Good" | "Fair" | "Needs Work";
  scoreDescription: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywords: string[];
  missingKeywords: string[];
  sections: {
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    hasCertifications: boolean;
    hasContactInfo: boolean;
  };
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  quickWins: string[];
}

export async function analyzeResume(
  resumeText: string
): Promise<ResumeAnalysisResult> {
  const prompt = `You are an expert resume analyst and ATS (Applicant Tracking System) specialist with 15+ years of experience helping people get hired.

Analyze this resume and return a detailed JSON response.

RESUME TEXT:
${resumeText}

Return a JSON object with EXACTLY this structure:
{
  "atsScore": <number 0-100>,
  "scoreLabel": "<Excellent|Good|Fair|Needs Work>",
  "scoreDescription": "<one sentence describing the overall quality>",
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>",
    "<specific strength 4>",
    "<specific strength 5>"
  ],
  "weaknesses": [
    "<specific weakness 1>",
    "<specific weakness 2>",
    "<specific weakness 3>",
    "<specific weakness 4>"
  ],
  "suggestions": [
    "<actionable suggestion 1>",
    "<actionable suggestion 2>",
    "<actionable suggestion 3>",
    "<actionable suggestion 4>",
    "<actionable suggestion 5>",
    "<actionable suggestion 6>"
  ],
  "keywords": [
    "<keyword 1>",
    "<keyword 2>",
    "..."
  ],
  "missingKeywords": [
    "<important missing keyword 1>",
    "<important missing keyword 2>",
    "..."
  ],
  "sections": {
    "hasSummary": <true/false>,
    "hasExperience": <true/false>,
    "hasEducation": <true/false>,
    "hasSkills": <true/false>,
    "hasCertifications": <true/false>,
    "hasContactInfo": <true/false>
  },
  "contactInfo": {
    "name": "<extracted name or empty string>",
    "email": "<extracted email or empty string>",
    "phone": "<extracted phone or empty string>",
    "location": "<extracted location or empty string>",
    "linkedin": "<extracted linkedin URL or empty string>"
  },
  "quickWins": [
    "<easy improvement 1>",
    "<easy improvement 2>",
    "<easy improvement 3>"
  ]
}

SCORING GUIDE (out of 100):
- Contact Info Complete: 10 points
- Strong Professional Summary: 15 points
- Quantified Achievements (numbers, metrics): 20 points
- Relevant Skills Section: 15 points
- Clear Work Experience Structure: 15 points
- Education & Certifications: 10 points
- Keyword Optimization: 10 points
- Grammar, Clarity, Formatting: 5 points

SCORE LABELS:
- 85-100: Excellent
- 70-84: Good
- 50-69: Fair
- 0-49: Needs Work

RULES:
- Be specific and actionable in strengths/weaknesses/suggestions
- Don't be generic — refer to actual content in the resume
- Extract 10-20 real keywords from the resume
- Identify 5-10 important keywords that are MISSING
- Quick wins are things they can fix in under 15 minutes
- Return ONLY valid JSON, no markdown, no explanations`;

  return generateJSONWithGemini<ResumeAnalysisResult>(prompt);
}
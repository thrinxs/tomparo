import { generateJSONWithGemini } from "@/lib/gemini";

export interface JobMatchResult {
  matchScore: number;
  matchLabel: "Excellent Fit" | "Strong Fit" | "Fair Fit" | "Weak Fit";
  overallAssessment: string;
  jobDetails: {
    title: string;
    company: string;
    location: string;
    employmentType: string;
    experienceLevel: string;
    salaryRange: string;
    remoteType: string;
  };
  matchedSkills: string[];
  missingSkills: MissingSkill[];
  matchedRequirements: string[];
  missingRequirements: string[];
  experienceMatch: {
    hasEnoughExperience: boolean;
    description: string;
  };
  educationMatch: {
    meetsRequirements: boolean;
    description: string;
  };
  applicationAdvice: {
    shouldApply: boolean;
    reasoning: string;
    keyPoints: string[];
    redFlags: string[];
    strengths: string[];
  };
  interviewFocus: string[];
  keywordsToInclude: string[];
  cvTweaks: string[];
}

export interface MissingSkill {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  matchImprovement: number;
}

export async function matchResumeToJob(
  resumeText: string,
  jobDescription: string
): Promise<JobMatchResult> {
  const prompt = `You are an expert career matching specialist and recruiter with deep knowledge of ATS systems and hiring practices.

Compare this candidate's resume to the job description and provide a detailed matching analysis.

CANDIDATE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return a detailed JSON response with EXACTLY this structure:
{
  "matchScore": <number 0-100>,
  "matchLabel": "<Excellent Fit|Strong Fit|Fair Fit|Weak Fit>",
  "overallAssessment": "<2-3 sentences on candidate fit>",
  "jobDetails": {
    "title": "<extracted job title>",
    "company": "<extracted company name>",
    "location": "<extracted location or 'Not specified'>",
    "employmentType": "<Full-time/Part-time/Contract/Internship>",
    "experienceLevel": "<Entry/Mid/Senior/Lead/Executive>",
    "salaryRange": "<extracted salary or 'Not specified'>",
    "remoteType": "<Remote/Hybrid/Onsite/Not specified>"
  },
  "matchedSkills": [
    "<skill 1>",
    "<skill 2>"
  ],
  "missingSkills": [
    {
      "skill": "<skill name>",
      "importance": "<critical|important|nice-to-have>",
      "matchImprovement": <estimated point boost if acquired>
    }
  ],
  "matchedRequirements": [
    "<requirement 1>",
    "<requirement 2>"
  ],
  "missingRequirements": [
    "<missing requirement 1>",
    "<missing requirement 2>"
  ],
  "experienceMatch": {
    "hasEnoughExperience": <true/false>,
    "description": "<explanation of experience fit>"
  },
  "educationMatch": {
    "meetsRequirements": <true/false>,
    "description": "<explanation of education fit>"
  },
  "applicationAdvice": {
    "shouldApply": <true/false>,
    "reasoning": "<1-2 sentences on whether to apply>",
    "keyPoints": [
      "<point 1>",
      "<point 2>",
      "<point 3>"
    ],
    "redFlags": [
      "<red flag 1>"
    ],
    "strengths": [
      "<strength 1>",
      "<strength 2>"
    ]
  },
  "interviewFocus": [
    "<topic to prepare 1>",
    "<topic to prepare 2>",
    "<topic to prepare 3>"
  ],
  "keywordsToInclude": [
    "<keyword to add to CV 1>",
    "<keyword to add to CV 2>"
  ],
  "cvTweaks": [
    "<specific CV improvement 1>",
    "<specific CV improvement 2>"
  ]
}

SCORING GUIDE (out of 100):
- Skills match (40 points)
- Experience relevance (25 points)
- Education fit (15 points)
- Overall alignment (20 points)

MATCH LABELS:
- 85-100: Excellent Fit
- 70-84: Strong Fit
- 50-69: Fair Fit
- 0-49: Weak Fit

RULES:
- Be specific and reference actual skills/experience
- Extract 5-15 matched skills
- Identify 3-10 missing skills (marked by importance)
- Provide actionable advice
- Consider both hard and soft skills
- Return ONLY valid JSON`;

return generateJSONWithGemini<JobMatchResult>(prompt, "job-match");
}
import { generateJSONWithGemini } from "@/lib/gemini";

export interface JobContext {
  title: string;
  requirements: string;
}

export interface DocumentDetection {
  type: "CV" | "COVER_LETTER" | "REFERENCE_LETTER" | "TRANSCRIPT" | "PORTFOLIO" | "OTHER";
  typeName: string;
  confidence: number;
  reason: string;
}

export async function detectDocumentType(text: string): Promise<DocumentDetection> {
  const prompt = `You are a document classification expert. Analyse the following document text and identify what type of document it is.

DOCUMENT TEXT (first 3000 characters):
${text.slice(0, 3000)}

Return ONLY valid JSON in this exact format:
{
  "type": "CV",
  "typeName": "Curriculum Vitae",
  "confidence": 95,
  "reason": "Document contains work experience, education, skills sections typical of a CV"
}

The type MUST be one of exactly these values:
- "CV" — A resume or curriculum vitae listing work experience, education, skills
- "COVER_LETTER" — A letter of application addressed to an employer
- "REFERENCE_LETTER" — A letter written by someone else recommending a candidate
- "TRANSCRIPT" — An academic transcript showing grades/courses
- "PORTFOLIO" — A portfolio of work samples
- "OTHER" — Any other document type

confidence is a number 0-100 representing how confident you are.`;

  try {
    const result = await generateJSONWithGemini<DocumentDetection>(prompt, "general");
    return result;
  } catch {
    return {
      type: "OTHER",
      typeName: "Unknown Document",
      confidence: 0,
      reason: "Could not determine document type",
    };
  }
}

export async function analyzeRecruiterCV(resumeText: string, jobContext?: JobContext): Promise<any> {
  const jobSection = jobContext
    ? `
JOB CONTEXT — Score this candidate specifically against this role:
Job Title: ${jobContext.title}
Key Requirements: ${jobContext.requirements}

When scoring, prioritise how well the candidate matches the above role requirements.
`
    : "";

  const prompt = `You are an expert recruiter and talent acquisition specialist. Analyse this candidate's CV and provide a detailed hiring assessment.
${jobSection}
CV TEXT:
${resumeText.slice(0, 8000)}

Return ONLY valid JSON in this exact format:
{
  "candidateName": "Full name or Unknown",
  "candidateEmail": "email or null",
  "candidatePhone": "phone or null",
  "candidateLocation": "location or null",
  "atsScore": 85,
  "hiringRecommendation": "Strong Hire",
  "confidenceScore": 87,
  "summary": "3-sentence plain English summary of this candidate for a recruiter",
  "experienceLevel": "Senior",
  "totalExperienceYears": 5,
  "currentRole": "Most recent job title or null",
  "currentCompany": "Most recent company or null",
  "topSkills": ["skill1", "skill2", "skill3"],
  "technicalSkills": ["skill1", "skill2"],
  "softSkills": ["skill1", "skill2"],
  "education": {
    "highestDegree": "BSc Computer Science",
    "institution": "University name",
    "graduationYear": "2019"
  },
  "strengths": [
    { "title": "Strong background", "detail": "Detail here" }
  ],
  "redFlags": [
    { "title": "Employment gap", "detail": "Detail here" }
  ],
  "keyAchievements": ["Achievement 1", "Achievement 2"],
  "industryBackground": ["Finance", "Technology"],
  "languagesSpoken": ["English"],
  "cvQuality": {
    "score": 78,
    "formatting": "Good",
    "completeness": "High",
    "clarity": "Clear"
  },
  "interviewRecommendation": "Recommended for technical interview",
  "salaryExpectation": "400000 - 600000 NGN per month"
}`;

  const result = await generateJSONWithGemini<any>(prompt);
  return result;
}

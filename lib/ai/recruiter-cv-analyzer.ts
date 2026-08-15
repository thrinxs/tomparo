import { generateJSONWithGemini } from "@/lib/gemini";

export interface JobContext {
  title: string;
  requirements: string;
}

export interface DocumentDetection {
  type: "CV" | "COVER_LETTER" | "REFERENCE_LETTER" | "TRANSCRIPT" | "PORTFOLIO" | "OTHER";
  typeName: string;
  confidence: number;
  reasoning: string;
  structureClues: string[];
  languageClues: string[];
}

export async function detectDocumentType(text: string): Promise<DocumentDetection> {
  const prompt = `You are an expert document analyst. Your job is to carefully read a document and determine exactly what type of document it is.

Study the following carefully:
1. STRUCTURE — What sections exist? (e.g. Work Experience, Education, Skills = CV. Dear Hiring Manager... = Cover Letter. To Whom It May Concern + signature of third party = Reference Letter. Course codes + grades = Transcript)
2. LAYOUT PATTERNS — Does it follow a resume template? Is it written as a letter? Is it a table of grades?
3. LANGUAGE TONE — Is it written in first person describing the writer's own experience? Is it addressed to someone? Is it written by someone else about the candidate?
4. CONTENT — What information dominates? Contact details + career history = CV. Motivation narrative = Cover Letter. Academic performance = Transcript. Work samples = Portfolio.
5. KEYWORDS — Look for section headers like "Summary", "Experience", "Education", "Skills", "References", "Objective" for CVs. "Dear", "I am writing", "sincerely" for cover letters. "GPA", "Grade", "Credits", "Semester" for transcripts. "To whom it may concern", "I hereby recommend" for reference letters.

DOCUMENT TEXT:
${text.slice(0, 5000)}

Return ONLY valid JSON:
{
  "type": "CV",
  "typeName": "Curriculum Vitae",
  "confidence": 95,
  "reasoning": "This document contains clearly structured sections including Work Experience with dated entries, Education with institution names, a Skills section, and contact information at the top. The language is written in first person describing the candidate's own professional history. The layout follows a standard CV template.",
  "structureClues": ["Has Work Experience section with dates", "Has Education section", "Has Skills section", "Contact info at top"],
  "languageClues": ["Written in first person", "Describes own achievements", "Professional summary present"]
}

type MUST be exactly one of: CV, COVER_LETTER, REFERENCE_LETTER, TRANSCRIPT, PORTFOLIO, OTHER
confidence is 0-100.
reasoning must be a detailed explanation of WHY you classified it this way.`;

  try {
    const result = await generateJSONWithGemini<DocumentDetection>(prompt, "general");
    return result;
  } catch {
    return {
      type: "OTHER",
      typeName: "Unknown Document",
      confidence: 0,
      reasoning: "Could not determine document type",
      structureClues: [],
      languageClues: [],
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

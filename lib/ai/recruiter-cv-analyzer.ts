import { generateJSONWithGemini } from "@/lib/gemini";

export async function analyzeRecruiterCV(resumeText: string): Promise<any> {
  const prompt = `You are an expert recruiter and talent acquisition specialist. Analyse this candidate's CV and provide a detailed hiring assessment.

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

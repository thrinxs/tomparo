import { generateJSONWithGemini } from "@/lib/gemini";

export interface SkillGapResult {
  overallScore: number;
  currentLevel: string;
  targetLevel: string;
  currentSkills: string[];
  missingSkills: MissingSkillDetail[];
  recommendedSkills: RecommendedSkill[];
  skillRoadmap: RoadmapPhase[];
  estimatedTimeToReady: string;
  marketInsights: {
    demandLevel: string;
    salaryImpact: string;
    trending: string[];
    declining: string[];
  };
}

export interface MissingSkillDetail {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  matchImprovement: number;
  timeToLearn: string;
  difficulty: "easy" | "medium" | "hard";
  learningResources: LearningResource[];
  certifications: CertificationResource[];
}

export interface RecommendedSkill {
  skill: string;
  reason: string;
  marketDemand: string;
  salaryImpact: string;
}

export interface LearningResource {
  title: string;
  platform: string;
  type: "free" | "paid";
  duration: string;
  url: string;
}

export interface CertificationResource {
  name: string;
  provider: string;
  cost: string;
  duration: string;
  value: string;
  url: string;
}

export interface RoadmapPhase {
  phase: string;
  duration: string;
  focus: string;
  skills: string[];
  outcome: string;
}

export async function analyzeSkillGap(
  resumeText: string,
  jobDescription?: string
): Promise<SkillGapResult> {
  const trimmedResume = resumeText.slice(0, 5000);
  const trimmedJob = jobDescription ? jobDescription.slice(0, 2000) : "";

  const contextSection = jobDescription
    ? `TARGET JOB:\n${trimmedJob}`
    : `Analyze based on their current career level.`;

  const prompt = `You are a career development expert. Analyze this candidate's skills.

RESUME:
${trimmedResume}

${contextSection}

Return ONLY valid JSON. Keep responses SHORT and focused. Maximum 4 missing skills, 3 recommendations, 3 roadmap phases.

{
  "overallScore": 65,
  "currentLevel": "Mid-Level Developer",
  "targetLevel": "Senior Developer",
  "currentSkills": ["React", "Node.js", "MongoDB"],
  "missingSkills": [
    {
      "skill": "TypeScript",
      "importance": "critical",
      "matchImprovement": 12,
      "timeToLearn": "2-3 weeks",
      "difficulty": "medium",
      "learningResources": [
        {
          "title": "TypeScript Deep Dive",
          "platform": "Free Book",
          "type": "free",
          "duration": "1 week",
          "url": "https://basarat.gitbook.io/typescript/"
        }
      ],
      "certifications": [
        {
          "name": "Microsoft TypeScript Certification",
          "provider": "Microsoft",
          "cost": "$165",
          "duration": "3 months",
          "value": "Industry recognized",
          "url": "https://learn.microsoft.com"
        }
      ]
    }
  ],
  "recommendedSkills": [
    {
      "skill": "System Design",
      "reason": "Essential for senior roles",
      "marketDemand": "Very High",
      "salaryImpact": "+30-40%"
    }
  ],
  "skillRoadmap": [
    {
      "phase": "Phase 1: Foundation",
      "duration": "Weeks 1-4",
      "focus": "Fill critical gaps",
      "skills": ["TypeScript"],
      "outcome": "Ready for senior interviews"
    }
  ],
  "estimatedTimeToReady": "3-6 months",
  "marketInsights": {
    "demandLevel": "Very High in Nigeria",
    "salaryImpact": "Could increase salary by 40-60%",
    "trending": ["AI/ML", "TypeScript", "AWS"],
    "declining": ["jQuery", "Legacy PHP"]
  }
}

STRICT RULES:
- Maximum 4 items in missingSkills array
- Maximum 1 learningResource per skill
- Maximum 1 certification per skill
- Maximum 3 items in recommendedSkills
- Maximum 3 phases in skillRoadmap
- Keep all strings SHORT (under 100 chars)
- Return ONLY valid JSON, no markdown, no explanations`;

return generateJSONWithGemini<SkillGapResult>(prompt, "skill-gap");
}
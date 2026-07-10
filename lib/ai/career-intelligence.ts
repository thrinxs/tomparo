import { generateJSONWithGemini } from "@/lib/gemini";

export interface CareerAnalysis {
  currentLevel: string;
  currentLevelDescription: string;
  targetLevel: string;
  targetLevelDescription: string;
  overallReadiness: number;
  yearsOfExperience: string;
  primaryField: string;
  
  skillsToAcquire: SkillRecommendation[];
  certificationsToPursue: CertificationRecommendation[];
  experienceGaps: ExperienceGap[];
  strengthsToLeverage: string[];
  
  marketDemand: {
    demandLevel: string;
    demandScore: number;
    trending: string[];
    outlook: string;
  };
  
  salaryInsights: {
    currentRange: string;
    targetRange: string;
    potentialIncrease: string;
    factors: string[];
  };
  
  actionPlan: ActionPhase[];
  estimatedTimeToTarget: string;
  
  careerRisks: string[];
  careerOpportunities: string[];
}

export interface SkillRecommendation {
  skill: string;
  priority: "critical" | "high" | "medium" | "low";
  reason: string;
  timeToLearn: string;
  impactOnCareer: string;
}

export interface CertificationRecommendation {
  name: string;
  provider: string;
  cost: string;
  duration: string;
  value: string;
  priority: "high" | "medium" | "low";
  url: string;
}

export interface ExperienceGap {
  gap: string;
  howToFill: string;
  urgency: "high" | "medium" | "low";
}

export interface ActionPhase {
  phase: string;
  timeframe: string;
  actions: string[];
  outcome: string;
}

export async function analyzeCareer(
  resumeText: string
): Promise<CareerAnalysis> {
  const trimmedResume = resumeText.slice(0, 6000);

  const prompt = `You are a senior career strategist. Analyze this candidate's career and provide deep strategic insights.

CANDIDATE RESUME:
${trimmedResume}

Return ONLY valid JSON. Keep values SHORT and focused.

{
  "currentLevel": "Mid-Level Full-Stack Developer",
  "currentLevelDescription": "3-5 years experience, works independently on features",
  "targetLevel": "Senior Full-Stack Developer",
  "targetLevelDescription": "5-8 years, leads projects and mentors juniors",
  "overallReadiness": 68,
  "yearsOfExperience": "4 years",
  "primaryField": "Software Engineering",
  
  "skillsToAcquire": [
    {
      "skill": "System Design",
      "priority": "critical",
      "reason": "Essential for senior-level interviews and architecture decisions",
      "timeToLearn": "3-6 months",
      "impactOnCareer": "Unlocks senior roles at top companies"
    }
  ],
  
  "certificationsToPursue": [
    {
      "name": "AWS Solutions Architect Associate",
      "provider": "Amazon",
      "cost": "$150",
      "duration": "3 months prep",
      "value": "High demand certification, opens cloud architect roles",
      "priority": "high",
      "url": "https://aws.amazon.com/certification/certified-solutions-architect-associate/"
    }
  ],
  
  "experienceGaps": [
    {
      "gap": "No leadership experience shown",
      "howToFill": "Volunteer to lead a project or mentor junior developers",
      "urgency": "high"
    }
  ],
  
  "strengthsToLeverage": [
    "Strong technical foundation",
    "Diverse project portfolio"
  ],
  
  "marketDemand": {
    "demandLevel": "Very High",
    "demandScore": 85,
    "trending": ["AI/ML", "Cloud Computing", "TypeScript"],
    "outlook": "Extremely positive - your skill set is in top 10% demand in Nigeria"
  },
  
  "salaryInsights": {
    "currentRange": "₦400,000 - ₦800,000/month",
    "targetRange": "₦800,000 - ₦1,500,000/month",
    "potentialIncrease": "+50-100%",
    "factors": [
      "Adding cloud certifications: +30%",
      "Moving to senior role: +50%",
      "Remote for international companies: +100%"
    ]
  },
  
  "actionPlan": [
    {
      "phase": "Phase 1: Foundation (Weeks 1-4)",
      "timeframe": "Month 1",
      "actions": [
        "Complete System Design course on Educative",
        "Start AWS SA-C03 preparation",
        "Update LinkedIn with recent projects"
      ],
      "outcome": "Foundation ready for senior interviews"
    }
  ],
  
  "estimatedTimeToTarget": "6-12 months",
  
  "careerRisks": [
    "Skill obsolescence if not learning new technologies",
    "Career stagnation without leadership experience"
  ],
  
  "careerOpportunities": [
    "Growing demand for full-stack engineers in Nigeria",
    "Remote work opens international salaries",
    "AI/ML skills command premium salaries"
  ]
}

STRICT RULES:
- overallReadiness: 0-100 (how ready they are for target level)
- yearsOfExperience: extract from resume
- primaryField: their main career field
- Maximum 5 items in skillsToAcquire
- Maximum 3 items in certificationsToPursue
- Maximum 4 items in experienceGaps
- Maximum 5 items in strengthsToLeverage
- Maximum 3 items in trending array
- Maximum 5 items in salary factors
- Maximum 4 phases in actionPlan (max 4 actions each)
- Maximum 3 items in careerRisks
- Maximum 4 items in careerOpportunities
- All strings under 100 chars
- Use REAL certifications with real URLs
- Include Nigerian salary context when possible
- Return ONLY valid JSON`;

return generateJSONWithGemini<CareerAnalysis>(prompt, "career-analysis");
}
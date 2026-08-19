export type SkillImportance =
  | "critical"
  | "important"
  | "nice-to-have";

export interface JobAnalysis {
  id?: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  requiredSkills: RequiredSkill[];
  responsibilities: string[];
  keywords: string[];
  experienceLevel: string;
  educationRequirement: string;
  salaryRange: string | null;
  jobType: string;
  summary: string;
}

export interface RequiredSkill {
  skill: string;
  importance: SkillImportance;
}

export interface JobMatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: MissingSkill[];
  recommendedSkills: RecommendedSkill[];
  overallAssessment: string;
  applicationAdvice: string;
}

export interface MissingSkill {
  skill: string;
  importance: SkillImportance;
  estimatedMatchImprovement: number;
}

export interface RecommendedSkill {
  skill: string;
  reason: string;
  estimatedMatchImprovement: number;
}
export interface SkillGapAnalysis {
    currentSkills: string[];
    requiredSkills: SkillStatus[];
    missingSkills: MissingSkillDetail[];
    skillRoadmap: RoadmapPhase[];
    estimatedTimeToReady: string;
  }
  
  export interface SkillStatus {
    skill: string;
    importance: string;
    hasSkill: boolean;
  }
  
  export interface MissingSkillDetail {
    skill: string;
    importance: string;
    matchImprovement: number;
    learningResources: LearningResource[];
    certifications: CertificationResource[];
  }
  
  export interface LearningResource {
    title: string;
    platform: string;
    url: string;
    type: "free" | "paid";
    duration: string;
  }
  
  export interface CertificationResource {
    name: string;
    provider: string;
    url: string;
    cost: string;
  }
  
  export interface RoadmapPhase {
    phase: string;
    duration: string;
    skills: string[];
    description: string;
  }
  
  export interface CareerIntelligence {
    currentLevel: string;
    nextLevel: string;
    skillsToAcquire: CareerSkill[];
    certificationsToGet: CareerCertification[];
    experienceGaps: string[];
    marketDemand: string;
    nextLevelRequirements: string[];
    estimatedTimeToNextLevel: string;
  }
  
  export interface CareerSkill {
    skill: string;
    reason: string;
    priority: "high" | "medium" | "low";
    marketDemand: string;
  }
  
  export interface CareerCertification {
    name: string;
    provider: string;
    url: string;
    cost: string;
    value: string;
  }
  
  export interface AIChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
  }
  
  export interface CoverLetterResult {
    coverLetter: string;
    score: number;
  }
  
  export interface EmailResult {
    subject: string;
    email: string;
    score: number;
  }
  
  export interface InterviewQuestion {
    question: string;
    category: "hr" | "technical" | "behavioral";
    tips: string;
  }
  
  export interface InterviewEvaluation {
    score: number;
    feedback: string;
    improvedAnswer: string;
    strengths: string[];
    improvements: string[];
  }
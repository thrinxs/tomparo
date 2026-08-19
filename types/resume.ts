export interface Resume {
    id: string;
    userId: string;
    title: string;
    fileName: string | null;
    fileUrl: string | null;
    rawText: string | null;
    parsedData: ParsedResume | null;
    atsScore: number | null;
    version: number;
    isOptimized: boolean;
    optimizedText: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ParsedResume {
    contactInfo: {
      name: string;
      email: string;
      phone: string;
      location: string;
      linkedin: string;
      website: string;
    };
    summary: string;
    experience: WorkExperience[];
    education: Education[];
    skills: string[];
    certifications: Certification[];
    languages: string[];
  }
  
  export interface WorkExperience {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }
  
  export interface Education {
    degree: string;
    institution: string;
    location: string;
    year: string;
    grade: string;
  }
  
  export interface Certification {
    name: string;
    issuer: string;
    date: string;
    url: string;
  }
  
  export interface ResumeAnalysisResult {
    atsScore: number;
    strengths: string[];
    weaknesses: string[];
    keywords: string[];
    suggestions: string[];
    parsedSections: ParsedResume;
  }
  
  export interface ResumeOptimizationResult {
    optimizedResume: string;
    changes: string[];
    newAtsScore: number;
  }
  
  export interface CVLiveUpdateItem {
    type: "experience" | "skill" | "certification";
    data: WorkExperience | string | Certification;
  }
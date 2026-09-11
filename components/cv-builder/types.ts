export interface Experience {
  id: string;
  title: string;
  company: string;
  from: string;
  to: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  from: string;
  to: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface CvData {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  certifications?: Certification[];
}

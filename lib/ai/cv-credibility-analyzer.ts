import { generateJSONWithGemini } from "@/lib/gemini";

export interface CredibilityFlag {
  type: "TIMELINE" | "SKILLS" | "EDUCATION" | "CONTACT" | "DESCRIPTION" | "CERTIFICATE" | "OTHER";
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
}

export interface VerifiableEntity {
  type: "EMPLOYER" | "INSTITUTION" | "CERTIFICATE";
  name: string;
  claimedDetail: string;
  suggestedEmails: string[];
}

export interface CredibilityResult {
  credibilityScore: number;
  flags: CredibilityFlag[];
  verifiableEntities: VerifiableEntity[];
  summary: string;
}

// Known Nigerian + international verification contacts
const KNOWN_ENTITIES: Record<string, string[]> = {
  // Nigerian universities
  "university of lagos": ["verification@unilag.edu.ng", "registrar@unilag.edu.ng"],
  "unilag": ["verification@unilag.edu.ng", "registrar@unilag.edu.ng"],
  "ahmadu bello university": ["registrar@abu.edu.ng", "verification@abu.edu.ng"],
  "obafemi awolowo university": ["registrar@oauife.edu.ng"],
  "university of ibadan": ["registrar@ui.edu.ng", "verification@ui.edu.ng"],
  "covenant university": ["registrar@covenantuniversity.edu.ng"],
  "babcock university": ["registrar@babcock.edu.ng"],
  "pan-atlantic university": ["info@pau.edu.ng"],
  "lagos state university": ["registrar@lasu.edu.ng"],
  "lasu": ["registrar@lasu.edu.ng"],

  // Nigerian certification bodies
  "nysc": ["info@nysc.gov.ng", "verification@nysc.gov.ng"],
  "ican": ["info@ican.org.ng", "membership@ican.org.ng"],
  "cipm": ["info@cipmnigeria.org"],
  "cima": ["verification@cimaglobal.com"],
  "acca": ["verification@accaglobal.com"],
  "cfa": ["info@cfainstitute.org"],
  "pmp": ["customercare@pmi.org"],
  "prince2": ["customer@axelos.com"],
  "isaca": ["verification@isaca.org"],

  // International certifications
  "aws": ["aws-training@amazon.com"],
  "amazon web services": ["aws-training@amazon.com"],
  "google": ["certifications@google.com"],
  "microsoft": ["mcp@microsoft.com"],
  "cisco": ["certifications@cisco.com"],
  "oracle": ["ocp@oracle.com"],
  "comptia": ["contactus@comptia.org"],
  "salesforce": ["certification@salesforce.com"],

  // Major Nigerian companies
  "zenith bank": ["hr@zenithbank.com", "recruitment@zenithbank.com"],
  "gtbank": ["recruitment@gtbank.com", "hr@gtbank.com"],
  "guaranty trust bank": ["recruitment@gtbank.com"],
  "first bank": ["hr@firstbanknigeria.com"],
  "access bank": ["recruitment@accessbankplc.com"],
  "uba": ["hr@ubagroup.com", "recruitment@ubagroup.com"],
  "united bank for africa": ["hr@ubagroup.com"],
  "sterling bank": ["hr@sterlingbank.com"],
  "union bank": ["hr@unionbankng.com"],
  "dangote": ["recruitment@dangote.com", "hr@dangote.com"],
  "mtn nigeria": ["hr@mtn.com.ng", "recruitment@mtn.com.ng"],
  "airtel": ["hr@ng.airtel.com"],
  "glo": ["hr@gloworld.com"],
  "flutterwave": ["people@flutterwave.com"],
  "paystack": ["people@paystack.com"],
  "interswitch": ["hr@interswitchgroup.com"],
  "konga": ["hr@konga.com"],
  "jumia": ["hr@jumia.com"],
  "andela": ["talent@andela.com"],
  "deloitte nigeria": ["ngtalent@deloitte.com"],
  "kpmg nigeria": ["ngkpmgrecruitment@kpmg.com"],
  "pwc nigeria": ["ng_recruitment@pwc.com"],
  "ernst & young": ["ng.recruitment@ng.ey.com"],
  "ey nigeria": ["ng.recruitment@ng.ey.com"],
  "shell nigeria": ["nigeria.recruitment@shell.com"],
  "chevron nigeria": ["nigeria@chevron.com"],
  "total energies": ["recruitment.nigeria@totalenergies.com"],
  "nestle nigeria": ["nigeria.hr@nestle.com"],
  "unilever nigeria": ["recruitment.nigeria@unilever.com"],
};

function getSuggestedEmails(entityName: string, entityType: string): string[] {
  const nameLower = entityName.toLowerCase().trim();

  // Check known entities first
  for (const [key, emails] of Object.entries(KNOWN_ENTITIES)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return emails;
    }
  }

  // Generate likely patterns from company name
  const slug = nameLower
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 20);

  const slugDomain = nameLower
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 20);

  if (entityType === "EMPLOYER") {
    return [
      `hr@${slug}.com`,
      `recruitment@${slug}.com`,
      `careers@${slug}.com`,
      `info@${slug}.com`,
      `hr@${slugDomain}.com.ng`,
    ];
  } else if (entityType === "INSTITUTION") {
    return [
      `registrar@${slug}.edu.ng`,
      `verification@${slug}.edu.ng`,
      `records@${slug}.edu.ng`,
      `info@${slug}.edu.ng`,
    ];
  } else {
    return [
      `verification@${slug}.com`,
      `info@${slug}.com`,
      `certification@${slug}.com`,
    ];
  }
}

export async function analyzeCvCredibility(
  resumeText: string,
  candidateName: string,
  atsScore: number
): Promise<CredibilityResult> {
  const prompt = `You are an expert CV fraud detection specialist. Carefully analyse this CV for credibility issues, inconsistencies, and extract all verifiable entities.

CANDIDATE NAME: ${candidateName}
ATS SCORE: ${atsScore}

CV TEXT:
${resumeText.slice(0, 8000)}

Perform these checks:
1. TIMELINE — Do employment dates overlap? Are there unexplained gaps? Does claimed experience add up?
2. SKILLS vs EXPERIENCE — Does claimed expertise match years of experience? Are there impossible claims (e.g. 10 years in a technology that's only 5 years old)?
3. EDUCATION — Does the institution name look real? Is the degree name legitimate? Is graduation year consistent with experience?
4. CONTACT — Is email format valid? Is phone format consistent with claimed location?
5. DESCRIPTIONS — Are job descriptions suspiciously vague or copy-pasted? Missing specific achievements?
6. CERTIFICATES — Do certificate names look legitimate? Are claim dates realistic?
7. LOCATION — Is there inconsistency between claimed location and other details?

Extract ALL verifiable entities:
- Every previous employer (company name + role + dates)
- Every educational institution (name + degree + year)
- Every certificate/qualification (name + issuing body + year)

Return ONLY valid JSON:
{
  "credibilityScore": 78,
  "flags": [
    {
      "type": "TIMELINE",
      "severity": "HIGH",
      "message": "Employment at Zenith Bank (2018-2020) overlaps with claimed role at GTBank (2019-2021)"
    },
    {
      "type": "SKILLS",
      "severity": "MEDIUM", 
      "message": "Claims 8 years React.js experience but React was created in 2013 — maximum possible is less than claimed"
    }
  ],
  "verifiableEntities": [
    {
      "type": "EMPLOYER",
      "name": "Zenith Bank",
      "claimedDetail": "Senior Software Engineer, January 2018 - December 2020"
    },
    {
      "type": "INSTITUTION",
      "name": "University of Lagos",
      "claimedDetail": "BSc Computer Science, 2014 - 2018"
    },
    {
      "type": "CERTIFICATE",
      "name": "AWS Solutions Architect",
      "claimedDetail": "Amazon Web Services, 2022"
    }
  ],
  "summary": "CV shows moderate credibility concerns. One timeline overlap detected between two roles. Education and contact details appear consistent."
}

credibilityScore: 0-100 (100 = fully credible, 0 = highly suspicious)
severity: HIGH (red flag, serious concern), MEDIUM (worth investigating), LOW (minor issue)
flags: empty array if no issues found`;

  try {
    const result = await generateJSONWithGemini<CredibilityResult>(prompt, "general");

    // Add suggested emails to each entity
    const entitiesWithEmails = (result.verifiableEntities || []).map((entity) => ({
      ...entity,
      suggestedEmails: getSuggestedEmails(entity.name, entity.type),
    }));

    // Calculate overall trust score: 60% ATS + 40% credibility
    const overallTrustScore = Math.round((atsScore * 0.6) + ((result.credibilityScore || 0) * 0.4));

    return {
      credibilityScore: result.credibilityScore || 0,
      flags: result.flags || [],
      verifiableEntities: entitiesWithEmails,
      summary: result.summary || "",
    };
  } catch {
    return {
      credibilityScore: 50,
      flags: [],
      verifiableEntities: [],
      summary: "Could not complete credibility analysis",
    };
  }
}

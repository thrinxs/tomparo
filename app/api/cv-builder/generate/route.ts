import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJSONWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const isPremium = (session.user as any).isPremium;

    const { resumeText, jobDescription, jobTitle, company } = await req.json();

    if (!jobDescription) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    // Pull user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    });

    // Use passed resumeText, or fall back to latest saved resume
    let baseResumeText = resumeText || "";
    if (!baseResumeText) {
      const latestResume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { rawText: true },
      });
      if (latestResume?.rawText) baseResumeText = latestResume.rawText;
    }

    if (!baseResumeText) {
      return NextResponse.json(
        { error: "No CV content found. Please upload your CV on the Job Match page first." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert CV writer. Create a tailored, professional CV for this job application.

## Candidate Profile
Name: ${user?.name || "Not provided"}
Email: ${user?.email || "Not provided"}
Phone: ${user?.phone || "Not provided"}

## Candidate's Existing CV / Resume
${baseResumeText}

## Target Job
Title: ${jobTitle || "Not specified"}
Company: ${company || "Not specified"}
Description:
${jobDescription}

## Instructions
1. Rewrite and tailor the CV specifically for this job.
2. Rewrite the professional summary to directly target this role.
3. Highlight and reorder experience entries most relevant to this job.
4. List only skills relevant to this role. Add matching ones from the job description the candidate likely has.
5. Keep all dates, companies, schools accurate — do NOT fabricate anything.
6. Output must be valid JSON only. No markdown, no explanations outside the JSON.

## Output Format (strict JSON)
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string or empty string",
  "linkedin": "string or empty string",
  "website": "string or empty string",
  "summary": "2-3 sentence tailored professional summary targeting this specific role",
  "experience": [
    {
      "id": "exp1",
      "title": "Job Title",
      "company": "Company Name",
      "from": "Month Year",
      "to": "Month Year",
      "current": false,
      "description": "Achievement-focused bullet points tailored to the target job. Use action verbs."
    }
  ],
  "education": [
    {
      "id": "edu1",
      "school": "School Name",
      "degree": "Degree",
      "field": "Field of Study",
      "from": "Year",
      "to": "Year"
    }
  ],
  "skills": ["skill1", "skill2"],
  "certifications": [
    {
      "id": "cert1",
      "name": "Certification Name",
      "issuer": "Issuer",
      "year": "Year"
    }
  ]
}
`;

    const cvData = await generateJSONWithGemini<{
      fullName: string;
      email: string;
      phone: string;
      location: string;
      linkedin: string;
      website: string;
      summary: string;
      experience: Array<{
        id: string; title: string; company: string;
        from: string; to: string; current: boolean; description: string;
      }>;
      education: Array<{
        id: string; school: string; degree: string;
        field: string; from: string; to: string;
      }>;
      skills: string[];
      certifications: Array<{
        id: string; name: string; issuer: string; year: string;
      }>;
    }>(prompt, "cv-analysis");

    const cvTitle =
      jobTitle && company
        ? `CV for ${jobTitle} at ${company}`
        : jobTitle
        ? `CV for ${jobTitle}`
        : "AI Tailored CV";

    const cv = await prisma.builtCV.create({
      data: {
        userId,
        title: cvTitle,
        template: isPremium ? "premium" : "basic",
        isAiGenerated: true,
        aiGeneratedFor: `${jobTitle || ""}${company ? ` at ${company}` : ""}`,
        fullName: cvData.fullName || user?.name || "",
        email: cvData.email || user?.email || "",
        phone: cvData.phone || user?.phone || "",
        location: cvData.location || "",
        linkedin: cvData.linkedin || "",
        website: cvData.website || "",
        summary: cvData.summary || "",
        experience: cvData.experience?.length ? JSON.stringify(cvData.experience) : null,
        education: cvData.education?.length ? JSON.stringify(cvData.education) : null,
        skills: cvData.skills?.length ? JSON.stringify(cvData.skills) : null,
        certifications: cvData.certifications?.length ? JSON.stringify(cvData.certifications) : null,
      },
    });

    return NextResponse.json({ success: true, cvId: cv.id, title: cv.title });
  } catch (err) {
    console.error("CV generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate CV" },
      { status: 500 }
    );
  }
}

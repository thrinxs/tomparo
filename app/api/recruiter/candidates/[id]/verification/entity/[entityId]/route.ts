import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendEmail } from "@/lib/email";

const OUTREACH_PLANS = [
  "RECRUITER_ENTERPRISE",
  "RECRUITER_SCALE",
  "RECRUITER_CUSTOM",
  "ADMIN",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entityId: string }> }
) {
  try {
    const { id, entityId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const role   = (session.user as any).role as string;
    const profile = await prisma.recruiterProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const entity = await prisma.cvVerifiableEntity.findFirst({
      where: { id: entityId, recruiterId: profile.id },
    });
    if (!entity) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

    const body = await req.json();
    const { action, contactEmail, contactName, notes, status } = body;

    const data: Prisma.CvVerifiableEntityUpdateInput = {};

    // Manual status update (Mark as Verified, Unverified, etc.)
    if (status) {
      data.status        = status;
      data.respondedAt   = new Date();
      data.notes         = notes || entity.notes;
    }

    // Update contact email/name
    if (contactEmail !== undefined) data.contactEmail = contactEmail;
    if (contactName  !== undefined) data.contactName  = contactName;
    if (notes        !== undefined) data.notes        = notes;

    // Send verification email
    if (action === "send_email") {
      if (!OUTREACH_PLANS.includes(role)) {
        return NextResponse.json({ error: "Upgrade to Enterprise to send verification emails", upgradeRequired: true }, { status: 403 });
      }

      if (!contactEmail) {
        return NextResponse.json({ error: "Contact email required" }, { status: 400 });
      }

      const candidate = await prisma.recruiterCandidate.findFirst({
        where: { id, recruiterId: profile.id },
        select: { candidateName: true },
      });

      const typeLabel =
        entity.type === "EMPLOYER" ? "Employment" :
        entity.type === "INSTITUTION" ? "Academic" : "Certification";

      const emailSubject = `${typeLabel} Verification Request — ${candidate?.candidateName || "Candidate"}`;

      const emailBody = `Dear ${contactName || "HR/Verification Team"},

I hope this message finds you well.

My name is ${profile.companyName} Recruitment Team, and we are writing to verify information provided by a candidate who has applied for a position at our organisation.

The candidate, ${candidate?.candidateName || "a job applicant"}, has listed the following on their CV:

${entity.claimedDetail || `${entity.type === "EMPLOYER" ? "Employment" : entity.type === "INSTITUTION" ? "Education" : "Certification"} at ${entity.name}`}

We would greatly appreciate your assistance in confirming the accuracy of this information. Please reply to this email with:

1. Confirmation of whether the above information is accurate
2. The dates of ${entity.type === "EMPLOYER" ? "employment" : entity.type === "INSTITUTION" ? "enrolment/graduation" : "certification"}
3. ${entity.type === "EMPLOYER" ? "The role held and reason for leaving, if applicable" : entity.type === "INSTITUTION" ? "The qualification awarded" : "The certification status and expiry date, if applicable"}

All information shared will be treated with strict confidentiality and used solely for employment verification purposes.

If you require any additional information or documentation from us, please do not hesitate to reach out.

Thank you sincerely for your time and cooperation.

Warm regards,
${profile.companyName} Recruitment Team
Powered by TomParo`;

      try {
        await sendEmail({
          to: contactEmail,
          subject: emailSubject,
          html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${emailBody}</pre>`,
          replyTo: profile.replyToEmail || undefined,
        });

        data.status  = "SENT";
        data.sentAt  = new Date();
        data.contactEmail = contactEmail;
        if (contactName) data.contactName = contactName;
      } catch {
        return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
      }
    }

    data.updatedAt = new Date();

    const updated = await prisma.cvVerifiableEntity.update({
      where: { id: entityId },
      data,
    });

    return NextResponse.json({ success: true, entity: updated });
  } catch (error) {
    console.error("Entity update error:", error);
    return NextResponse.json({ error: "Failed to update entity" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const userEmail = (session.user as any).email;
    const { id } = await params;

    const cv = await prisma.builtCV.findFirst({ where: { id, userId } });
    if (!cv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Send email with download link + summary
    const experience = cv.experience ? JSON.parse(cv.experience) : [];
    const skills = cv.skills ? JSON.parse(cv.skills) : [];

    await resend.emails.send({
      from: "TomParo <noreply@tomparo.com>",
      to: userEmail,
      subject: `Your CV is ready — ${cv.title}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#7c3aed;">Your CV is ready, ${cv.fullName?.split(" ")[0] || "there"}! 🎉</h2>
          <p style="color:#374151;">Your CV "<strong>${cv.title}</strong>" has been saved to your TomParo dashboard.</p>

          <div style="background:#f8f7ff;border:1px solid #e9d5ff;border-radius:12px;padding:16px;margin:20px 0;">
            <h3 style="color:#7c3aed;margin:0 0 8px;">${cv.fullName || "Your Name"}</h3>
            ${cv.email ? `<p style="margin:2px 0;color:#555;">${cv.email}</p>` : ""}
            ${cv.phone ? `<p style="margin:2px 0;color:#555;">${cv.phone}</p>` : ""}
            ${cv.location ? `<p style="margin:2px 0;color:#555;">${cv.location}</p>` : ""}
            ${skills.length ? `<p style="margin:8px 0 2px;color:#7c3aed;font-weight:600;">Skills</p><p style="color:#555;">${skills.join(" · ")}</p>` : ""}
            ${experience.length ? `<p style="margin:8px 0 2px;color:#7c3aed;font-weight:600;">Experience</p><p style="color:#555;">${experience.map((e: any) => `${e.title} at ${e.company}`).join(", ")}</p>` : ""}
          </div>

          <a href="https://www.tomparo.com/dashboard/cv-builder"
            style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            View & Download Your CV
          </a>

          <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
            Log into your TomParo dashboard to download as DOCX or make edits anytime.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CV email error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

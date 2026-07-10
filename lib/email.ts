import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM = {
  hire: "TomParo Hiring <hire@tomparo.com>",
  noreply: "TomParo <noreply@tomparo.com>",
  support: "TomParo Support <support@tomparo.com>",
  billing: "TomParo Billing <billing@tomparo.com>",
  hello: "TomParo <hello@tomparo.com>",
};

export type EmailType =
  | "interview_invite"
  | "rejection"
  | "offer"
  | "followup"
  | "waitlist"
  | "password_reset"
  | "welcome";

// ── Base HTML template ─────────────────────────────────────────────────────────

function baseTemplate(
  content: string,
  companyName: string,
  trackingPixelUrl?: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${companyName}</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Powered by TomParo</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">${content}</td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;">
                This email was sent via TomParo — Nigeria's AI Recruitment Platform
              </p>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.3);font-size:12px;">
                <a href="https://www.tomparo.com" style="color:#7c3aed;text-decoration:none;">www.tomparo.com</a>
              </p>
              ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;color:rgba(255,255,255,0.85);font-size:15px;line-height:1.7;">${text}</p>`;
}

function h2(text: string): string {
  return `<h2 style="margin:0 0 20px;color:#ffffff;font-size:20px;font-weight:700;">${text}</h2>`;
}

function btn(text: string, href: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">${text}</a>
  </div>`;
}

function infoBox(label: string, value: string, color = "#7c3aed"): string {
  return `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px 20px;margin:16px 0;">
    <p style="margin:0 0 4px;color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
    <p style="margin:0;color:${color};font-size:16px;font-weight:600;">${value}</p>
  </div>`;
}

function messageToHtml(message: string): string {
  return message
    .split("\n\n")
    .map((para) => p(para.replace(/\n/g, "<br/>")))
    .join("");
}

// ── Core send function ─────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
  cc,
  attachments,
}: SendEmailOptions) {
  const payload: any = {
    from: from || FROM.hire,
    to,
    subject,
    html,
  };

  if (replyTo) payload.reply_to = replyTo;
  if (cc && cc.length > 0) payload.cc = cc;
  if (attachments && attachments.length > 0) payload.attachments = attachments;

  return await resend.emails.send(payload);
}

// ── Recruiter email options ────────────────────────────────────────────────────

export interface RecruiterEmailOptions {
  to: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  message: string;
  recruiterName: string;
  replyTo?: string;
  cc?: string[];
  attachments?: SendEmailOptions["attachments"];
  trackingPixelUrl?: string;
}

// ── Recruiter email builders ───────────────────────────────────────────────────

export async function sendInterviewInvite(
  opts: RecruiterEmailOptions & {
    interviewDate?: string;
    interviewType?: string;
    interviewLink?: string;
  }
) {
  const html = baseTemplate(
    `${h2(`Interview Invitation — ${opts.jobTitle}`)}
     ${p(`Dear ${opts.candidateName},`)}
     ${messageToHtml(opts.message)}
     ${opts.interviewDate ? infoBox("Interview Date & Time", opts.interviewDate, "#f59e0b") : ""}
     ${opts.interviewType ? infoBox("Interview Format", opts.interviewType, "#7c3aed") : ""}
     ${opts.interviewLink ? btn("Join Interview", opts.interviewLink) : ""}
     ${p(`If you have any questions, please reply to this email.`)}
     ${p(`Best regards,<br/><strong style="color:#fff;">${opts.recruiterName}</strong><br/>${opts.companyName}`)}`,
    opts.companyName,
    opts.trackingPixelUrl
  );

  return sendEmail({
    to: opts.to,
    subject: `Interview Invitation — ${opts.jobTitle} at ${opts.companyName}`,
    html,
    replyTo: opts.replyTo,
    cc: opts.cc,
    attachments: opts.attachments,
  });
}

export async function sendRejectionEmail(opts: RecruiterEmailOptions) {
  const html = baseTemplate(
    `${h2(`Application Update — ${opts.jobTitle}`)}
     ${p(`Dear ${opts.candidateName},`)}
     ${messageToHtml(opts.message)}
     ${p(`We appreciate your interest in ${opts.companyName} and encourage you to apply for future opportunities.`)}
     ${p(`Best regards,<br/><strong style="color:#fff;">${opts.recruiterName}</strong><br/>${opts.companyName}`)}`,
    opts.companyName,
    opts.trackingPixelUrl
  );

  return sendEmail({
    to: opts.to,
    subject: `Your Application for ${opts.jobTitle} at ${opts.companyName}`,
    html,
    replyTo: opts.replyTo,
    cc: opts.cc,
    attachments: opts.attachments,
  });
}

export async function sendOfferEmail(
  opts: RecruiterEmailOptions & {
    salary?: string;
    startDate?: string;
  }
) {
  const html = baseTemplate(
    `${h2(`🎉 Job Offer — ${opts.jobTitle}`)}
     ${p(`Dear ${opts.candidateName},`)}
     ${messageToHtml(opts.message)}
     ${infoBox("Position", opts.jobTitle, "#10b981")}
     ${opts.salary ? infoBox("Compensation", opts.salary, "#10b981") : ""}
     ${opts.startDate ? infoBox("Start Date", opts.startDate, "#10b981") : ""}
     ${p(`Please reply to this email to confirm your acceptance or discuss further details.`)}
     ${p(`We look forward to welcoming you to the team!`)}
     ${p(`Best regards,<br/><strong style="color:#fff;">${opts.recruiterName}</strong><br/>${opts.companyName}`)}`,
    opts.companyName,
    opts.trackingPixelUrl
  );

  return sendEmail({
    to: opts.to,
    subject: `Job Offer — ${opts.jobTitle} at ${opts.companyName} 🎉`,
    html,
    replyTo: opts.replyTo,
    cc: opts.cc,
    attachments: opts.attachments,
  });
}

export async function sendFollowUpEmail(opts: RecruiterEmailOptions) {
  const html = baseTemplate(
    `${h2(`Following Up — ${opts.jobTitle}`)}
     ${p(`Dear ${opts.candidateName},`)}
     ${messageToHtml(opts.message)}
     ${p(`Please don't hesitate to reach out if you have any questions.`)}
     ${p(`Best regards,<br/><strong style="color:#fff;">${opts.recruiterName}</strong><br/>${opts.companyName}`)}`,
    opts.companyName,
    opts.trackingPixelUrl
  );

  return sendEmail({
    to: opts.to,
    subject: `Following Up on Your Application — ${opts.jobTitle} at ${opts.companyName}`,
    html,
    replyTo: opts.replyTo,
    cc: opts.cc,
    attachments: opts.attachments,
  });
}

export async function sendWaitlistEmail(opts: RecruiterEmailOptions) {
  const html = baseTemplate(
    `${h2(`Application Update — ${opts.jobTitle}`)}
     ${p(`Dear ${opts.candidateName},`)}
     ${messageToHtml(opts.message)}
     ${p(`We will keep your profile on file and reach out if a suitable opportunity arises.`)}
     ${p(`Best regards,<br/><strong style="color:#fff;">${opts.recruiterName}</strong><br/>${opts.companyName}`)}`,
    opts.companyName,
    opts.trackingPixelUrl
  );

  return sendEmail({
    to: opts.to,
    subject: `Application Update — ${opts.jobTitle} at ${opts.companyName}`,
    html,
    replyTo: opts.replyTo,
    cc: opts.cc,
    attachments: opts.attachments,
  });
}

// ── System emails ──────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({
  to,
  name,
  isRecruiter = false,
}: {
  to: string;
  name: string;
  isRecruiter?: boolean;
}) {
  const html = baseTemplate(
    `${h2(`Welcome to TomParo, ${name}! 🎉`)}
     ${p(isRecruiter
       ? "Your recruiter account is ready. Start uploading CVs, posting jobs, and hiring smarter with AI."
       : "Your account is ready. Upload your CV and let AI help you land your dream job faster."
     )}
     ${btn(
       isRecruiter ? "Go to Recruiter Dashboard" : "Go to Dashboard",
       isRecruiter ? "https://www.tomparo.com/recruiter" : "https://www.tomparo.com/dashboard"
     )}
     ${p("If you have any questions, reply to this email or visit our support centre.")}`,
    "TomParo"
  );

  return sendEmail({
    to,
    subject: "Welcome to TomParo 🎉",
    html,
    from: FROM.hello,
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetLink,
}: {
  to: string;
  name: string;
  resetLink: string;
}) {
  const html = baseTemplate(
    `${h2("Password Reset Request")}
     ${p(`Hi ${name},`)}
     ${p("We received a request to reset your TomParo password. Click the button below to set a new password.")}
     ${btn("Reset My Password", resetLink)}
     ${p("This link expires in 1 hour. If you didn't request this, you can safely ignore this email.")}`,
    "TomParo"
  );

  return sendEmail({
    to,
    subject: "Reset your TomParo password",
    html,
    from: FROM.noreply,
  });
}

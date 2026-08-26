import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const adminRole = (session?.user as any)?.role as string;
    if (adminRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { subject, message, audience } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: "subject and message required" }, { status: 400 });
    }

    // audience: "all" | "premium" | "free" | "recruiters"
    const roleFilter: Record<string, any> = {
      all: undefined,
      premium: { role: "PREMIUM" },
      free: { role: "FREE" },
      recruiters: { role: { startsWith: "RECRUITER" } },
    };

    const where = roleFilter[audience ?? "all"];

    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        role: { not: "SUSPENDED" },
        ...where,
      },
      select: { email: true, name: true },
      take: 500, // safety cap
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "No users found for this audience" }, { status: 400 });
    }

    // Send in batches of 50 (Resend batch limit)
    const batchSize = 50;
    let sent = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(
        batch.map((u) =>
          resend.emails.send({
            from: "TomParo <noreply@tomparo.com>",
            to: u.email!,
            subject,
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                <h2 style="color:#7c3aed;margin-bottom:8px;">${subject}</h2>
                <p style="color:#374151;white-space:pre-wrap;">${message}</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
                <p style="color:#9ca3af;font-size:13px;">
                  You received this because you have a TomParo account.
                  <a href="https://www.tomparo.com" style="color:#7c3aed;">Visit TomParo</a>
                </p>
              </div>
            `,
          })
        )
      );
      sent += batch.length;
    }

    return NextResponse.json({ success: true, sent });
  } catch (err: any) {
    console.error("Announcement error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

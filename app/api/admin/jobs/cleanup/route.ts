import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint is called by a cron job or manually by admin
// It marks expired jobs and removes them from public listing
export async function POST(req: NextRequest) {
  try {
    // Verify secret to prevent unauthorized calls
    const { secret } = await req.json().catch(() => ({}));
    if (secret !== process.env.NEXTAUTH_SECRET?.slice(0, 16)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Mark jobs past deadline as CLOSED
    const expired = await prisma.jobPosting.updateMany({
      where: {
        deadline: { lt: now },
        status: { in: ["ACTIVE", "PAUSED"] },
      },
      data: {
        status: "CLOSED",
        expiredAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      expired: expired.count,
      message: `${expired.count} jobs marked as expired`,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

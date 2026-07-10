import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── 1x1 transparent PNG pixel ─────────────────────────────────────────────────
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  try {
    const { emailId } = await params;

    // Record the open
    await prisma.recruiterEmail.update({
      where: { id: emailId },
      data: {
        openedAt: new Date(),
        openCount: { increment: 1 },
        status: "opened",
      },
    });
  } catch {
    // Silently fail — never break email delivery for tracking errors
  }

  // Always return the pixel regardless of DB success
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Pragma": "no-cache",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// POST — candidate uploads recording blob at end of interview
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify interview exists via shareToken in header
    const shareToken = req.headers.get("x-share-token");
    if (!shareToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const interview = await prisma.recruiterInterview.findFirst({
      where: { id, shareToken },
    });
    if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("recording") as File;
    if (!file) return NextResponse.json({ error: "No recording provided" }, { status: 400 });

    const ext = interview.interviewType === "VIDEO" ? "webm" : "webm";
    const path = `interviews/${id}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("recordings")
      .upload(path, buffer, {
        contentType: file.type || "audio/webm",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    await prisma.recruiterInterview.update({
      where: { id },
      data: {
        recordingUrl: path,
        recordingUploadedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, path });
  } catch (error) {
    console.error("Recording upload error:", error);
    return NextResponse.json({ error: "Failed to upload recording" }, { status: 500 });
  }
}

// GET — recruiter gets signed URL to play recording
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const interview = await prisma.recruiterInterview.findUnique({ where: { id } });
    if (!interview?.recordingUrl) {
      return NextResponse.json({ error: "No recording found" }, { status: 404 });
    }

    const { data, error } = await supabase.storage
      .from("recordings")
      .createSignedUrl(interview.recordingUrl, 3600);

    if (error) throw error;

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error("Get recording error:", error);
    return NextResponse.json({ error: "Failed to get recording" }, { status: 500 });
  }
}

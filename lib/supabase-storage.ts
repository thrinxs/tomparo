import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BUCKET = "cvs";

// ── Upload CV file ─────────────────────────────────────────────────────────────
export async function uploadCV(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folder: string
): Promise<string | null> {
  try {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}_${sanitized}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    return data.path;
  } catch (err) {
    console.error("Upload CV error:", err);
    return null;
  }
}

// ── Generate signed URL (valid for 1 hour) ────────────────────────────────────
export async function getSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Signed URL error:", error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Get signed URL error:", err);
    return null;
  }
}

// ── Delete CV file ─────────────────────────────────────────────────────────────
export async function deleteCV(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (error) {
      console.error("Delete CV error:", error);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

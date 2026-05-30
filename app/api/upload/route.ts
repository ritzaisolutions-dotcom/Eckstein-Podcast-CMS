import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireSession } from "@/lib/require-session";

export async function POST(req: NextRequest) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) return NextResponse.json({ error: "File too large (max 500MB)" }, { status: 413 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Local dev without Blob token — return placeholder
    return NextResponse.json({ ok: true, key, url: `/api/media/${key}`, filename: file.name, mime: file.type, sizeBytes: file.size });
  }

  const blob = await put(key, file, { access: "public", contentType: file.type });

  return NextResponse.json({
    ok: true,
    key,
    url: blob.url,
    filename: file.name,
    mime: file.type,
    sizeBytes: file.size,
  });
}

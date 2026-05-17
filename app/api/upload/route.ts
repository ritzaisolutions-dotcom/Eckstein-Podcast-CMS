import { NextRequest, NextResponse } from "next/server";

// R2 upload endpoint — accepts multipart form data, stores in R2, returns blob URL
export async function POST(req: NextRequest) {
  // Check auth cookie
  const session = req.cookies.get("eckstein_session");
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File too large (max 500MB)" }, { status: 413 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const buffer = await file.arrayBuffer();

  // In Workers environment: use env.MEDIA R2 bucket
  // const { env } = getRequestContext();
  // await env.MEDIA.put(key, buffer, { httpMetadata: { contentType: file.type } });
  // const publicUrl = `https://pub-YOUR_ACCOUNT_HASH.r2.dev/${key}`;

  // Placeholder for local dev:
  console.log("Upload:", { key, size: file.size, type: file.type });

  return NextResponse.json({
    ok: true,
    key,
    url: `/api/upload/placeholder/${key}`, // replace with real R2 public URL in prod
    filename: file.name,
    mime: file.type,
    sizeBytes: file.size,
  });
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require("@opennextjs/cloudflare");
    const { env } = getRequestContext();
    const bucket = env.MEDIA as R2Bucket | undefined;

    if (!bucket) {
      return NextResponse.json({ error: "No media bucket binding configured" }, { status: 503 });
    }

    const object = await bucket.get(objectKey);
    if (!object) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    return new NextResponse(object.body, { headers });
  } catch {
    return NextResponse.json({ error: "Media unavailable in this environment" }, { status: 503 });
  }
}

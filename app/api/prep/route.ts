import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { episodePreps, prepSections } from "@/lib/db/schema";
import { requireSession } from "@/lib/require-session";

const DEFAULT_SECTIONS = [
  { slug: "thema",      label: "Thema & Kernaussage",   orderIndex: 0 },
  { slug: "gliederung", label: "Gliederung",             orderIndex: 1 },
  { slug: "quellen",    label: "Quellen & Inspiration",  orderIndex: 2 },
  { slug: "fragen",     label: "Interviewfragen",        orderIndex: 3 },
  { slug: "notizen",    label: "Notizen",                orderIndex: 4 },
];

export async function POST(req: NextRequest) {
  const authError = await requireSession(req);
  if (authError) return authError;

  const body = await req.json();
  const { workingTitle, episodeNumber, templateSlug, plannedDate } = body;
  if (!workingTitle) return NextResponse.json({ error: "workingTitle required" }, { status: 400 });

  const db = getDb();
  const id = crypto.randomUUID();

  await db.insert(episodePreps).values({
    id,
    workingTitle,
    episodeNumber: episodeNumber ? Number(episodeNumber) : null,
    templateSlug: templateSlug ?? "standard",
    plannedDate: plannedDate ? new Date(plannedDate) : null,
  });

  const sections = DEFAULT_SECTIONS.map(s => ({
    id: crypto.randomUUID(),
    prepId: id,
    slug: s.slug,
    label: s.label,
    bodyMd: "",
    orderIndex: s.orderIndex,
  }));
  await db.insert(prepSections).values(sections);

  return NextResponse.json({ id });
}

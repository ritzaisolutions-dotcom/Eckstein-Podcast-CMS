import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, forumThreads, clipQueue, prepSections, episodeTasks, contentPieces, episodePreps } from "@/lib/db";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; username?: string; first_name: string };
    chat: { id: number };
    text?: string;
    voice?: { file_id: string; duration: number };
    caption?: string;
  };
}

type TelegramFrom = NonNullable<TelegramUpdate["message"]>["from"];

function parseTimestamp(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function getAuthor(from?: TelegramFrom): string {
  if (!from) return "telegram";
  const name = from.username ?? from.first_name;
  return name.toLowerCase().includes("florian") ? "florian" : "kevin";
}

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const allowedChatIds = (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? "")
    .split(",").map(s => s.trim()).filter(Boolean);

  const update: TelegramUpdate = await req.json();
  const msg = update.message;
  if (!msg) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);
  if (allowedChatIds.length > 0 && !allowedChatIds.includes(chatId)) {
    return NextResponse.json({ ok: true });
  }

  const text = (msg.text ?? msg.caption ?? "").trim();
  if (!text) return NextResponse.json({ ok: true });

  const author = getAuthor(msg.from);
  const telegramMsgId = String(msg.message_id);
  const db = getDb();

  try {
    // #short ep12 0:34 Hook über Scheitern → clip_queue
    const shortMatch = text.match(/^#short\s+(?:ep(\d+))?\s*([\d:]+)?\s+(.+)$/i);
    if (shortMatch) {
      const epNum = shortMatch[1] ? parseInt(shortMatch[1], 10) : null;
      const tsSec = shortMatch[2] ? parseTimestamp(shortMatch[2]) : null;
      const note = shortMatch[3];
      let contentId: string | null = null;
      if (epNum) {
        const ep = await db.select({ id: contentPieces.id }).from(contentPieces)
          .where(eq(contentPieces.episodeNumber, epNum)).limit(1);
        contentId = ep[0]?.id ?? null;
      }
      if (contentId) {
        await db.insert(clipQueue).values({ contentId, timestampSec: tsSec ?? undefined, note, status: "timestamp_marked" });
      } else {
        await db.insert(forumThreads).values({ title: note.slice(0, 80), bodyMd: `Clip ohne Episode: ${text}`, status: "idea", createdBy: author, source: "telegram", telegramMsgId, tags: JSON.stringify(["clip"]) });
      }
      return NextResponse.json({ ok: true });
    }

    // #idee → forum_threads
    const ideeMatch = text.match(/^#idee\s+(.+)$/i);
    if (ideeMatch) {
      await db.insert(forumThreads).values({ title: ideeMatch[1].slice(0, 120), bodyMd: ideeMatch[1], status: "idea", createdBy: author, source: "telegram", telegramMsgId, tags: JSON.stringify(["folgenidee"]) });
      return NextResponse.json({ ok: true });
    }

    // #quote → forum_threads
    const quoteMatch = text.match(/^#quote\s+(.+)$/i);
    if (quoteMatch) {
      await db.insert(forumThreads).values({ title: `Zitat: ${quoteMatch[1].slice(0, 80)}`, bodyMd: quoteMatch[1], status: "idea", createdBy: author, source: "telegram", telegramMsgId, tags: JSON.stringify(["quote"]) });
      return NextResponse.json({ ok: true });
    }

    // #prep ep13 Kernfrage: ... → prep_sections
    const prepMatch = text.match(/^#prep\s+ep(\d+)\s+(.+)$/i);
    if (prepMatch) {
      const epNum = parseInt(prepMatch[1], 10);
      const content = prepMatch[2];
      const prep = await db.select({ id: episodePreps.id }).from(episodePreps)
        .where(eq(episodePreps.episodeNumber, epNum)).limit(1);
      if (prep[0]) {
        const lower = content.toLowerCase();
        let sectionSlug = "offene_punkte";
        if (lower.startsWith("kernfrage")) sectionSlug = "kernfrage";
        else if (lower.startsWith("hook") || lower.startsWith("opener")) sectionSlug = "hooks";
        else if (lower.startsWith("quelle")) sectionSlug = "quellen";
        else if (lower.startsWith("zitat") || lower.startsWith("quote")) sectionSlug = "quotes";
        else if (lower.startsWith("frage")) sectionSlug = "fragen_liste";
        const existing = await db.select().from(prepSections)
          .where(eq(prepSections.prepId, prep[0].id))
          .then(rows => rows.find(r => r.slug === sectionSlug));
        if (existing) {
          await db.update(prepSections).set({ bodyMd: `${existing.bodyMd ?? ""}\n\n_[Telegram ${new Date().toISOString()}]_\n${content}`, lastEditedBy: author, lastEditedAt: new Date() }).where(eq(prepSections.id, existing.id));
        } else {
          await db.insert(prepSections).values({ prepId: prep[0].id, slug: sectionSlug, label: sectionSlug.replace(/_/g, " "), bodyMd: `_[Telegram ${new Date().toISOString()}]_\n${content}`, lastEditedBy: author });
        }
      } else {
        await db.insert(forumThreads).values({ title: `Prep Ep${epNum}: ${content.slice(0, 80)}`, bodyMd: content, status: "idea", createdBy: author, source: "telegram", telegramMsgId, tags: JSON.stringify(["prep", `ep${epNum}`]) });
      }
      return NextResponse.json({ ok: true });
    }

    // #todo → episode_tasks
    const todoMatch = text.match(/^#todo\s+(.+)$/i);
    if (todoMatch) {
      const label = todoMatch[1];
      const epRef = label.match(/ep(\d+)/i);
      let contentId: string | null = null;
      if (epRef) {
        const ep = await db.select({ id: contentPieces.id }).from(contentPieces)
          .where(eq(contentPieces.episodeNumber, parseInt(epRef[1], 10))).limit(1);
        contentId = ep[0]?.id ?? null;
      }
      if (contentId) {
        const existing = await db.select({ orderIndex: episodeTasks.orderIndex }).from(episodeTasks).where(eq(episodeTasks.contentId, contentId));
        const maxOrder = existing.length > 0 ? Math.max(...existing.map(r => r.orderIndex)) + 1 : 0;
        await db.insert(episodeTasks).values({ contentId, label, done: false, orderIndex: maxOrder });
      } else {
        await db.insert(forumThreads).values({ title: `Todo: ${label.slice(0, 80)}`, bodyMd: label, status: "idea", createdBy: author, source: "telegram", telegramMsgId, tags: JSON.stringify(["todo"]) });
      }
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    console.error("Telegram inbound error:", e);
  }

  return NextResponse.json({ ok: true });
}

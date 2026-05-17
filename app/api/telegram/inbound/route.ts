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

type TelegramAuthor = NonNullable<TelegramUpdate["message"]>["from"];

// Parses timestamp strings like "0:34", "1:23:45" to seconds
function parseTimestamp(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function getAuthor(from?: TelegramAuthor): string {
  if (!from) return "telegram";
  const name = from.username ?? from.first_name;
  return name.toLowerCase().includes("florian") ? "florian" : "kevin";
}

export async function POST(req: NextRequest) {
  // Verify Telegram webhook secret
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const providedSecret = req.nextUrl.searchParams.get("secret");
  if (secret && providedSecret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const allowedChatIds = (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

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

  // Get DB binding
  let db: ReturnType<typeof getDb> | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require("@opennextjs/cloudflare");
    const { env } = getRequestContext();
    if (env.DB) db = getDb(env.DB as D1Database);
  } catch {
    // local dev without wrangler
  }

  if (!db) {
    console.log("Telegram inbound (no DB):", { chatId, text: text.slice(0, 100) });
    return NextResponse.json({ ok: true });
  }

  try {
    // #short ep12 0:34 Hook über Scheitern → clip_queue
    const shortMatch = text.match(/^#short\s+(?:ep(\d+))?\s*([\d:]+)?\s+(.+)$/i);
    if (shortMatch) {
      const epNum = shortMatch[1] ? parseInt(shortMatch[1], 10) : null;
      const tsSec = shortMatch[2] ? parseTimestamp(shortMatch[2]) : null;
      const note = shortMatch[3];

      let contentId: string | null = null;
      if (epNum) {
        const ep = await db
          .select({ id: contentPieces.id })
          .from(contentPieces)
          .where(eq(contentPieces.episodeNumber, epNum))
          .limit(1);
        contentId = ep[0]?.id ?? null;
      }

      if (contentId) {
        await db.insert(clipQueue).values({
          contentId,
          timestampSec: tsSec ?? undefined,
          note,
          status: "timestamp_marked",
        });
      } else {
        // No matching episode found — save as mind dump with tag 'clip'
        await db.insert(forumThreads).values({
          title: note.slice(0, 80),
          bodyMd: `Clip-Shortcut ohne Episode-Zuordnung: ${text}`,
          status: "idea",
          createdBy: author,
          source: "telegram",
          telegramMsgId,
          tags: JSON.stringify(["clip"]),
        });
      }
      return NextResponse.json({ ok: true });
    }

    // #idee Folge über Selbstdisziplin → forum_threads
    const ideeMatch = text.match(/^#idee\s+(.+)$/i);
    if (ideeMatch) {
      await db.insert(forumThreads).values({
        title: ideeMatch[1].slice(0, 120),
        bodyMd: ideeMatch[1],
        status: "idea",
        createdBy: author,
        source: "telegram",
        telegramMsgId,
        tags: JSON.stringify(["folgenidee"]),
      });
      return NextResponse.json({ ok: true });
    }

    // #quote "Text" — Author → forum_threads with tag 'quote'
    const quoteMatch = text.match(/^#quote\s+(.+)$/i);
    if (quoteMatch) {
      await db.insert(forumThreads).values({
        title: `Zitat: ${quoteMatch[1].slice(0, 80)}`,
        bodyMd: quoteMatch[1],
        status: "idea",
        createdBy: author,
        source: "telegram",
        telegramMsgId,
        tags: JSON.stringify(["quote"]),
      });
      return NextResponse.json({ ok: true });
    }

    // #prep ep13 Kernfrage: Was ist Demut? → prep_sections
    const prepMatch = text.match(/^#prep\s+ep(\d+)\s+(.+)$/i);
    if (prepMatch) {
      const epNum = parseInt(prepMatch[1], 10);
      const content = prepMatch[2];

      // Find the prep for this episode number
      const prep = await db
        .select({ id: episodePreps.id })
        .from(episodePreps)
        .where(eq(episodePreps.episodeNumber, epNum))
        .limit(1);

      if (prep[0]) {
        // Determine which section slug to target based on keywords
        let sectionSlug = "offene_punkte";
        const lower = content.toLowerCase();
        if (lower.startsWith("kernfrage")) sectionSlug = "kernfrage";
        else if (lower.startsWith("hook") || lower.startsWith("opener")) sectionSlug = "hooks";
        else if (lower.startsWith("quelle") || lower.startsWith("source")) sectionSlug = "quellen";
        else if (lower.startsWith("quote") || lower.startsWith("zitat")) sectionSlug = "quotes";
        else if (lower.startsWith("frage")) sectionSlug = "fragen_liste";

        // Append to existing section or create new
        const existing = await db
          .select()
          .from(prepSections)
          .where(eq(prepSections.prepId, prep[0].id))
          .then(rows => rows.find(r => r.slug === sectionSlug));

        if (existing) {
          await db
            .update(prepSections)
            .set({
              bodyMd: `${existing.bodyMd ?? ""}\n\n_[Telegram ${new Date().toISOString()}]_\n${content}`,
              lastEditedBy: author,
              lastEditedAt: new Date(),
            })
            .where(eq(prepSections.id, existing.id));
        } else {
          await db.insert(prepSections).values({
            prepId: prep[0].id,
            slug: sectionSlug,
            label: sectionSlug.replace(/_/g, " "),
            bodyMd: `_[Telegram ${new Date().toISOString()}]_\n${content}`,
            lastEditedBy: author,
          });
        }
      } else {
        // No prep found — save as mind dump
        await db.insert(forumThreads).values({
          title: `Prep Ep${epNum}: ${content.slice(0, 80)}`,
          bodyMd: content,
          status: "idea",
          createdBy: author,
          source: "telegram",
          telegramMsgId,
          tags: JSON.stringify(["prep", `ep${epNum}`]),
        });
      }
      return NextResponse.json({ ok: true });
    }

    // #todo Thumbnail für Ep12 hochladen → episode_tasks
    const todoMatch = text.match(/^#todo\s+(.+)$/i);
    if (todoMatch) {
      const label = todoMatch[1];
      // Try to find a matching episode number mentioned in the label
      const epRef = label.match(/ep(\d+)/i);
      let contentId: string | null = null;
      if (epRef) {
        const ep = await db
          .select({ id: contentPieces.id })
          .from(contentPieces)
          .where(eq(contentPieces.episodeNumber, parseInt(epRef[1], 10)))
          .limit(1);
        contentId = ep[0]?.id ?? null;
      }

      if (contentId) {
        const maxOrderResult = await db
          .select({ orderIndex: episodeTasks.orderIndex })
          .from(episodeTasks)
          .where(eq(episodeTasks.contentId, contentId))
          .orderBy(episodeTasks.orderIndex);
        const maxOrder = maxOrderResult.length > 0
          ? Math.max(...maxOrderResult.map(r => r.orderIndex)) + 1
          : 0;
        await db.insert(episodeTasks).values({
          contentId,
          label,
          done: false,
          orderIndex: maxOrder,
        });
      } else {
        // No episode match — log as mind dump
        await db.insert(forumThreads).values({
          title: `Todo: ${label.slice(0, 80)}`,
          bodyMd: label,
          status: "idea",
          createdBy: author,
          source: "telegram",
          telegramMsgId,
          tags: JSON.stringify(["todo"]),
        });
      }
      return NextResponse.json({ ok: true });
    }

    // Plain message (no shortcut) → ignore silently
    console.log("Telegram inbound (no shortcut):", { chatId, text: text.slice(0, 100) });
  } catch (e) {
    console.error("Telegram inbound error:", e);
  }

  return NextResponse.json({ ok: true });
}

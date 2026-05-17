import { NextRequest, NextResponse } from "next/server";

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

function parseShortcut(text: string): { type: string; body: string } | null {
  const t = text.trim();
  const SHORT = /^#short\s+(ep\d+)?\s*([\d:]+)?\s+(.+)$/i;
  const IDEE = /^#idee\s+(.+)$/i;
  const PREP = /^#prep\s+(ep\d+)\s+(.+)$/i;
  const TODO = /^#todo\s+(.+)$/i;
  const QUOTE = /^#quote\s+(.+)$/i;

  if (SHORT.test(t)) return { type: "clip_queue", body: t };
  if (IDEE.test(t)) return { type: "mind_dump", body: t };
  if (PREP.test(t)) return { type: "prep_section", body: t };
  if (TODO.test(t)) return { type: "episode_task", body: t };
  if (QUOTE.test(t)) return { type: "mind_dump_quote", body: t };
  return null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const providedSecret = req.nextUrl.searchParams.get("secret");
  if (secret && providedSecret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const allowedChatIds = (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const update: TelegramUpdate = await req.json();
  const msg = update.message;

  if (!msg) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);
  if (allowedChatIds.length > 0 && !allowedChatIds.includes(chatId)) {
    return NextResponse.json({ ok: true });
  }

  const text = msg.text ?? msg.caption ?? "";
  const shortcut = text ? parseShortcut(text) : null;

  // TODO: insert into DB based on shortcut type
  // - clip_queue → insert into clip_queue
  // - mind_dump / mind_dump_quote → insert into forum_threads
  // - prep_section → insert into prep_sections
  // - episode_task → toggle/add episode_tasks

  console.log("Telegram inbound:", { chatId, shortcut: shortcut?.type ?? "plain", text: text.slice(0, 100) });

  return NextResponse.json({ ok: true });
}

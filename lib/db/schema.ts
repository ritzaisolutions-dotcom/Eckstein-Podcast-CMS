import { sqliteTable, text, integer, blob, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Platforms (seeded, static) ──────────────────────────────────────────────

export const platforms = sqliteTable("platforms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  kind: text("kind").notNull(), // 'long' | 'short' | 'social' | 'blog'
  maxCaptionChars: integer("max_caption_chars"),
});

// ─── Content Pieces (central table for all content types) ────────────────────

export const contentPieces = sqliteTable("content_pieces", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(), // 'lfc' | 'sfc' | 'article' | 'newsletter' | 'social_post' | 'media'
  title: text("title").notNull(),
  slug: text("slug"),
  bio: text("bio"),
  bodyMd: text("body_md"),
  thumbnailUrl: text("thumbnail_url"),
  episodeNumber: integer("episode_number"),
  durationLabel: text("duration_label"),
  hasPrayer: integer("has_prayer", { mode: "boolean" }).default(false),
  parentId: text("parent_id"),
  guestId: text("guest_id"),
  status: text("status").notNull().default("draft"), // 'draft' | 'scheduled' | 'published'
  createdBy: text("created_by").notNull().default("kevin"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
  uploadDate: integer("upload_date", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

// ─── Content Platform Links ───────────────────────────────────────────────────

export const contentPlatformLinks = sqliteTable("content_platform_links", {
  contentId: text("content_id").notNull(),
  platformId: integer("platform_id").notNull(),
  url: text("url"),
  caption: text("caption"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }),
  postedAt: integer("posted_at", { mode: "timestamp_ms" }),
  externalId: text("external_id"),
}, (t) => ({
  pk: primaryKey({ columns: [t.contentId, t.platformId] }),
}));

// ─── Analytics Snapshots (append-only) ───────────────────────────────────────

export const analyticsSnapshots = sqliteTable("analytics_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: text("content_id").notNull(),
  platformId: integer("platform_id").notNull(),
  capturedAt: integer("captured_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  watchTimeSec: integer("watch_time_sec"),
  source: text("source").notNull().default("api"), // 'api' | 'manual'
});

// ─── Media Assets ─────────────────────────────────────────────────────────────

export const mediaAssets = sqliteTable("media_assets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  filename: text("filename").notNull(),
  blobUrl: text("blob_url").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes"),
  tags: text("tags").default("[]"), // JSON array
  uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const mediaAssetLinks = sqliteTable("media_asset_links", {
  assetId: text("asset_id").notNull(),
  contentId: text("content_id").notNull(),
  role: text("role").notNull(), // 'thumbnail' | 'clip' | 'prep_file' | 'show_notes_image' | 'audio_memo'
}, (t) => ({
  pk: primaryKey({ columns: [t.assetId, t.contentId, t.role] }),
}));

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const contentTags = sqliteTable("content_tags", {
  contentId: text("content_id").notNull(),
  tagId: integer("tag_id").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.contentId, t.tagId] }),
}));

// ─── Episode Tasks (Sunday-Drop Checkliste) ───────────────────────────────────

export const episodeTasks = sqliteTable("episode_tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contentId: text("content_id").notNull(),
  label: text("label").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

// ─── Reminder Templates ───────────────────────────────────────────────────────

export const reminderTemplates = sqliteTable("reminder_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  triggerType: text("trigger_type").notNull(), // 'before_publish' | 'after_publish' | 'weekly'
  offsetDays: integer("offset_days").notNull().default(0),
  offsetDirection: text("offset_direction").notNull().default("after"), // 'before' | 'after'
  actionLabel: text("action_label").notNull(),
  platformSlug: text("platform_slug"),
});

// ─── Caption Templates ────────────────────────────────────────────────────────

export const captionTemplates = sqliteTable("caption_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  platformSlug: text("platform_slug").notNull(),
  name: text("name").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

// ─── Clip Queue ───────────────────────────────────────────────────────────────

export const clipQueue = sqliteTable("clip_queue", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contentId: text("content_id").notNull(),
  timestampSec: integer("timestamp_sec"),
  note: text("note"),
  status: text("status").notNull().default("timestamp_marked"), // 'timestamp_marked' | 'caption_ready' | 'exported' | 'posted'
  clipContentId: text("clip_content_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

// ─── Guests ───────────────────────────────────────────────────────────────────

export const guests = sqliteTable("guests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  bioMd: text("bio_md"),
  photoUrl: text("photo_url"),
  socials: text("socials").default("{}"), // JSON: {instagram, x, linkedin, website}
  contactEnc: blob("contact_enc"),
  topics: text("topics").default("[]"), // JSON array
  status: text("status").notNull().default("angefragt"), // 'angefragt' | 'zugesagt' | 'aufgenommen' | 'mehrfach'
  notesEnc: blob("notes_enc"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

// ─── Episode Preps ────────────────────────────────────────────────────────────

export const episodePreps = sqliteTable("episode_preps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  episodeNumber: integer("episode_number"),
  workingTitle: text("working_title").notNull(),
  templateSlug: text("template_slug").notNull().default("standard"), // 'standard' | 'gast' | 'solo' | 'streit'
  status: text("status").notNull().default("sammeln"), // 'sammeln' | 'strukturieren' | 'ready_to_record' | 'recorded'
  plannedDate: integer("planned_date", { mode: "timestamp_ms" }),
  linkedContentId: text("linked_content_id"),
  createdBy: text("created_by").notNull().default("kevin"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const prepSections = sqliteTable("prep_sections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prepId: text("prep_id").notNull(),
  slug: text("slug").notNull(), // 'kernfrage' | 'roter_faden' | 'argumente_kevin' | etc.
  label: text("label").notNull(),
  bodyMd: text("body_md").default(""),
  status: text("status").notNull().default("offen"), // 'offen' | 'bearbeitet' | 'final'
  orderIndex: integer("order_index").notNull().default(0),
  lastEditedBy: text("last_edited_by"),
  lastEditedAt: integer("last_edited_at", { mode: "timestamp_ms" }),
});

export const prepAttachments = sqliteTable("prep_attachments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prepId: text("prep_id").notNull(),
  sectionId: text("section_id"),
  blobUrl: text("blob_url").notNull(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes"),
  uploadedBy: text("uploaded_by").notNull().default("kevin"),
  uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const prepComments = sqliteTable("prep_comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prepId: text("prep_id").notNull(),
  sectionId: text("section_id"),
  bodyMd: text("body_md").notNull(),
  author: text("author").notNull().default("kevin"),
  mentions: text("mentions").default("[]"), // JSON array
  resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const prepShareLinks = sqliteTable("prep_share_links", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prepId: text("prep_id").notNull(),
  token: text("token").notNull().unique(),
  passwordHash: text("password_hash"),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  readOnly: integer("read_only", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

// ─── Mind Dump (Forum) ────────────────────────────────────────────────────────

export const forumThreads = sqliteTable("forum_threads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  bodyMd: text("body_md").default(""),
  status: text("status").notNull().default("idea"), // 'idea' | 'in_arbeit' | 'umgesetzt' | 'verworfen'
  createdBy: text("created_by").notNull().default("kevin"),
  source: text("source").notNull().default("cms"), // 'cms' | 'telegram'
  telegramMsgId: text("telegram_msg_id"),
  tags: text("tags").default("[]"), // JSON array
  reactions: text("reactions").default("{}"), // JSON: {fire: 0, star: 0, thumbs_up: 0}
  convertedTo: text("converted_to"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const forumReplies = sqliteTable("forum_replies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text("thread_id").notNull(),
  bodyMd: text("body_md").notNull(),
  author: text("author").notNull().default("kevin"),
  source: text("source").notNull().default("cms"),
  telegramMsgId: text("telegram_msg_id"),
  mediaUrl: text("media_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

// ─── Vault ────────────────────────────────────────────────────────────────────

export const vaultEntries = sqliteTable("vault_entries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull(), // 'platform' | 'infra' | 'mail' | 'payment' | 'tool' | 'misc'
  platformSlug: text("platform_slug"),
  title: text("title").notNull(),
  loginUrl: text("login_url"),
  username: text("username"),
  email: text("email"),
  passwordEnc: blob("password_enc"),
  passwordSalt: blob("password_salt"),
  passwordIv: blob("password_iv"),
  recoveryCodesEnc: blob("recovery_codes_enc"),
  apiTokensEnc: blob("api_tokens_enc"),
  notesEnc: blob("notes_enc"),
  quickLinks: text("quick_links").default("[]"), // JSON: [{label, url}]
  tags: text("tags").default("[]"),
  lastRotatedAt: integer("last_rotated_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

export const vaultAuditLog = sqliteTable("vault_audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryId: text("entry_id").notNull(),
  action: text("action").notNull(), // 'view' | 'reveal' | 'copy' | 'create' | 'update' | 'delete'
  at: integer("at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
});

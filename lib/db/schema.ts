import { pgTable, text, integer, boolean, bigserial, serial, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Platforms (seeded, static) ──────────────────────────────────────────────

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  kind: text("kind").notNull(), // 'long' | 'short' | 'social' | 'blog'
  maxCaptionChars: integer("max_caption_chars"),
});

// ─── Content Pieces (central table for all content types) ────────────────────

export const contentPieces = pgTable("content_pieces", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contentId: serial("content_id"), // global auto-increment across all types
  typeIndex: integer("type_index"),  // per-type counter (set on insert)
  type: text("type").notNull(), // 'lfc' | 'sfc' | 'article' | 'social_post'
  title: text("title").notNull(),
  slug: text("slug"),
  bio: text("bio"),
  bodyMd: text("body_md"),
  thumbnailUrl: text("thumbnail_url"),
  episodeNumber: integer("episode_number"),
  durationLabel: text("duration_label"),
  hasPrayer: boolean("has_prayer").default(false),
  parentId: text("parent_id"),
  guestId: text("guest_id"),
  status: text("status").notNull().default("draft"), // 'draft' | 'scheduled' | 'published'
  lifecycleStage: text("lifecycle_stage").notNull().default("draft"), // 'draft' | 'scripting' | 'filming' | 'editing' | 'revision' | 'live'
  filmingDate: timestamp("filming_date"),
  createdBy: text("created_by").notNull().default("kevin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  uploadDate: timestamp("upload_date"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  typeStatusIdx: index("content_pieces_type_status_idx").on(t.type, t.status),
  typeLifecycleIdx: index("content_pieces_type_lifecycle_idx").on(t.type, t.lifecycleStage),
}));

// ─── Content Platform Links ───────────────────────────────────────────────────

export const contentPlatformLinks = pgTable("content_platform_links", {
  contentId: text("content_id").notNull(),
  platformId: integer("platform_id").notNull(),
  url: text("url"),
  caption: text("caption"),
  scheduledAt: timestamp("scheduled_at"),
  postedAt: timestamp("posted_at"),
  externalId: text("external_id"),
}, (t) => ({
  pk: primaryKey({ columns: [t.contentId, t.platformId] }),
  scheduledIdx: index("content_platform_links_scheduled_idx").on(t.scheduledAt),
  postedIdx: index("content_platform_links_posted_idx").on(t.postedAt),
}));

// ─── Analytics Snapshots (append-only) ───────────────────────────────────────

export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  contentId: text("content_id").notNull(),
  platformId: integer("platform_id").notNull(),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  watchTimeSec: integer("watch_time_sec"),
  source: text("source").notNull().default("api"), // 'api' | 'manual'
}, (t) => ({
  contentIdx: index("analytics_snapshots_content_id_idx").on(t.contentId),
  platformIdx: index("analytics_snapshots_platform_id_idx").on(t.platformId),
  contentPlatformIdx: index("analytics_snapshots_content_platform_idx").on(t.contentId, t.platformId),
}));

// ─── Media Assets ─────────────────────────────────────────────────────────────

export const mediaAssets = pgTable("media_assets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  filename: text("filename").notNull(),
  blobUrl: text("blob_url").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes"),
  tags: text("tags").default("[]"), // JSON array
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const mediaAssetLinks = pgTable("media_asset_links", {
  assetId: text("asset_id").notNull(),
  contentId: text("content_id").notNull(),
  role: text("role").notNull(), // 'thumbnail' | 'clip' | 'prep_file' | 'show_notes_image' | 'audio_memo'
}, (t) => ({
  pk: primaryKey({ columns: [t.assetId, t.contentId, t.role] }),
}));

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const contentTags = pgTable("content_tags", {
  contentId: text("content_id").notNull(),
  tagId: integer("tag_id").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.contentId, t.tagId] }),
}));

// ─── Episode Tasks (Sunday-Drop Checkliste) ───────────────────────────────────

export const episodeTasks = pgTable("episode_tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contentId: text("content_id").notNull(),
  label: text("label").notNull(),
  done: boolean("done").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Reminder Templates ───────────────────────────────────────────────────────

export const reminderTemplates = pgTable("reminder_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  triggerType: text("trigger_type").notNull(), // 'before_publish' | 'after_publish' | 'weekly'
  offsetDays: integer("offset_days").notNull().default(0),
  offsetDirection: text("offset_direction").notNull().default("after"), // 'before' | 'after'
  actionLabel: text("action_label").notNull(),
  platformSlug: text("platform_slug"),
});

// ─── Caption Templates ────────────────────────────────────────────────────────

export const captionTemplates = pgTable("caption_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  platformSlug: text("platform_slug").notNull(),
  name: text("name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Clip Queue ───────────────────────────────────────────────────────────────

export const clipQueue = pgTable("clip_queue", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contentId: text("content_id").notNull(),
  timestampSec: integer("timestamp_sec"),
  note: text("note"),
  status: text("status").notNull().default("timestamp_marked"), // 'timestamp_marked' | 'caption_ready' | 'exported' | 'posted'
  clipContentId: text("clip_content_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Guests ───────────────────────────────────────────────────────────────────

export const guests = pgTable("guests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  bioMd: text("bio_md"),
  photoUrl: text("photo_url"),
  socials: text("socials").default("{}"), // JSON: {instagram, x, linkedin, website}
  contactEnc: text("contact_enc"), // base64-encoded encrypted blob
  topics: text("topics").default("[]"), // JSON array
  status: text("status").notNull().default("angefragt"), // 'angefragt' | 'zugesagt' | 'aufgenommen' | 'mehrfach'
  notesEnc: text("notes_enc"), // base64-encoded encrypted blob
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Episode Preps ────────────────────────────────────────────────────────────

export const episodePreps = pgTable("episode_preps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  episodeNumber: integer("episode_number"),
  workingTitle: text("working_title").notNull(),
  templateSlug: text("template_slug").notNull().default("standard"),
  status: text("status").notNull().default("sammeln"), // 'sammeln' | 'strukturieren' | 'ready_to_record' | 'recorded'
  plannedDate: timestamp("planned_date"),
  linkedContentId: text("linked_content_id"),
  createdBy: text("created_by").notNull().default("kevin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const prepSections = pgTable("prep_sections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prepId: text("prep_id").notNull(),
  slug: text("slug").notNull(),
  label: text("label").notNull(),
  bodyMd: text("body_md").default(""),
  status: text("status").notNull().default("offen"), // 'offen' | 'bearbeitet' | 'final'
  orderIndex: integer("order_index").notNull().default(0),
  lastEditedBy: text("last_edited_by"),
  lastEditedAt: timestamp("last_edited_at"),
});

export const prepAttachments = pgTable("prep_attachments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prepId: text("prep_id").notNull(),
  sectionId: text("section_id"),
  blobUrl: text("blob_url").notNull(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes"),
  uploadedBy: text("uploaded_by").notNull().default("kevin"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const prepComments = pgTable("prep_comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prepId: text("prep_id").notNull(),
  sectionId: text("section_id"),
  bodyMd: text("body_md").notNull(),
  author: text("author").notNull().default("kevin"),
  mentions: text("mentions").default("[]"), // JSON array
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const prepShareLinks = pgTable("prep_share_links", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prepId: text("prep_id").notNull(),
  token: text("token").notNull().unique(),
  passwordHash: text("password_hash"),
  expiresAt: timestamp("expires_at"),
  readOnly: boolean("read_only").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Mind Dump (Forum) ────────────────────────────────────────────────────────

export const forumThreads = pgTable("forum_threads", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const forumReplies = pgTable("forum_replies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text("thread_id").notNull(),
  bodyMd: text("body_md").notNull(),
  author: text("author").notNull().default("kevin"),
  source: text("source").notNull().default("cms"),
  telegramMsgId: text("telegram_msg_id"),
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Vault ────────────────────────────────────────────────────────────────────

export const vaultEntries = pgTable("vault_entries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull(), // 'platform' | 'infra' | 'mail' | 'payment' | 'tool' | 'misc'
  platformSlug: text("platform_slug"),
  title: text("title").notNull(),
  loginUrl: text("login_url"),
  username: text("username"),
  email: text("email"),
  // encryptPacked blobs stored as base64 text (Postgres bytea via text is simpler cross-env)
  passwordEnc: text("password_enc"),
  passwordSalt: text("password_salt"), // kept for schema compat, unused by encryptPacked
  passwordIv: text("password_iv"),     // kept for schema compat, unused by encryptPacked
  recoveryCodesEnc: text("recovery_codes_enc"),
  apiTokensEnc: text("api_tokens_enc"),
  notesEnc: text("notes_enc"),
  quickLinks: text("quick_links").default("[]"),
  tags: text("tags").default("[]"),
  lastRotatedAt: timestamp("last_rotated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vaultAuditLog = pgTable("vault_audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  entryId: text("entry_id").notNull(),
  action: text("action").notNull(), // 'view' | 'reveal' | 'copy' | 'create' | 'update' | 'delete'
  at: timestamp("at").notNull().defaultNow(),
});

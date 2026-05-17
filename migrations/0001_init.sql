-- Eckstein CMS — D1 Schema v1
-- Apply with: wrangler d1 execute eckstein-cms-db --file=migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS platforms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  kind TEXT NOT NULL,
  max_caption_chars INTEGER
);

CREATE TABLE IF NOT EXISTS content_pieces (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT,
  bio TEXT,
  body_md TEXT,
  thumbnail_url TEXT,
  episode_number INTEGER,
  duration_label TEXT,
  has_prayer INTEGER DEFAULT 0,
  parent_id TEXT,
  guest_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT NOT NULL DEFAULT 'kevin',
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  upload_date INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS content_platform_links (
  content_id TEXT NOT NULL,
  platform_id INTEGER NOT NULL,
  url TEXT,
  caption TEXT,
  scheduled_at INTEGER,
  posted_at INTEGER,
  external_id TEXT,
  PRIMARY KEY (content_id, platform_id)
);

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id TEXT NOT NULL,
  platform_id INTEGER NOT NULL,
  captured_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  watch_time_sec INTEGER,
  source TEXT NOT NULL DEFAULT 'api'
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  blob_url TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes INTEGER,
  tags TEXT DEFAULT '[]',
  uploaded_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS media_asset_links (
  asset_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  role TEXT NOT NULL,
  PRIMARY KEY (asset_id, content_id, role)
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS content_tags (
  content_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (content_id, tag_id)
);

CREATE TABLE IF NOT EXISTS episode_tasks (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  label TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS reminder_templates (
  id TEXT PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  offset_days INTEGER NOT NULL DEFAULT 0,
  offset_direction TEXT NOT NULL DEFAULT 'after',
  action_label TEXT NOT NULL,
  platform_slug TEXT
);

CREATE TABLE IF NOT EXISTS caption_templates (
  id TEXT PRIMARY KEY,
  platform_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS clip_queue (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  timestamp_sec INTEGER,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'timestamp_marked',
  clip_content_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bio_md TEXT,
  photo_url TEXT,
  socials TEXT DEFAULT '{}',
  contact_enc BLOB,
  topics TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'angefragt',
  notes_enc BLOB,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS episode_preps (
  id TEXT PRIMARY KEY,
  episode_number INTEGER,
  working_title TEXT NOT NULL,
  template_slug TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'sammeln',
  planned_date INTEGER,
  linked_content_id TEXT,
  created_by TEXT NOT NULL DEFAULT 'kevin',
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS prep_sections (
  id TEXT PRIMARY KEY,
  prep_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  body_md TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offen',
  order_index INTEGER NOT NULL DEFAULT 0,
  last_edited_by TEXT,
  last_edited_at INTEGER
);

CREATE TABLE IF NOT EXISTS prep_attachments (
  id TEXT PRIMARY KEY,
  prep_id TEXT NOT NULL,
  section_id TEXT,
  blob_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes INTEGER,
  uploaded_by TEXT NOT NULL DEFAULT 'kevin',
  uploaded_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS prep_comments (
  id TEXT PRIMARY KEY,
  prep_id TEXT NOT NULL,
  section_id TEXT,
  body_md TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'kevin',
  mentions TEXT DEFAULT '[]',
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS prep_share_links (
  id TEXT PRIMARY KEY,
  prep_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  expires_at INTEGER,
  read_only INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body_md TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'idea',
  created_by TEXT NOT NULL DEFAULT 'kevin',
  source TEXT NOT NULL DEFAULT 'cms',
  telegram_msg_id TEXT,
  tags TEXT DEFAULT '[]',
  reactions TEXT DEFAULT '{}',
  converted_to TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  body_md TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'kevin',
  source TEXT NOT NULL DEFAULT 'cms',
  telegram_msg_id TEXT,
  media_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS vault_entries (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  platform_slug TEXT,
  title TEXT NOT NULL,
  login_url TEXT,
  username TEXT,
  email TEXT,
  password_enc BLOB,
  password_salt BLOB,
  password_iv BLOB,
  recovery_codes_enc BLOB,
  api_tokens_enc BLOB,
  notes_enc BLOB,
  quick_links TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  last_rotated_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE TABLE IF NOT EXISTS vault_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id TEXT NOT NULL,
  action TEXT NOT NULL,
  at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

-- ─── Seed: Platforms ──────────────────────────────────────────────────────────
INSERT OR IGNORE INTO platforms (slug, label, kind, max_caption_chars) VALUES
  ('youtube',    'YouTube',       'long',   5000),
  ('rumble',     'Rumble',        'long',   5000),
  ('spotify',    'Spotify',       'long',   NULL),
  ('yt_shorts',  'YouTube Shorts','short',  5000),
  ('tiktok',     'TikTok',        'short',  2200),
  ('ig_reels',   'Instagram Reels','short', 2200),
  ('instagram',  'Instagram',     'social', 2200),
  ('x',          'X (Twitter)',   'social', 280),
  ('substack',   'Substack',      'blog',   NULL),
  ('website',    'Website',       'blog',   NULL);

-- ─── Seed: Default Sunday-Drop reminder templates ─────────────────────────────
INSERT OR IGNORE INTO reminder_templates (id, trigger_type, offset_days, offset_direction, action_label, platform_slug) VALUES
  ('rt-1', 'before_publish', 3, 'before', 'X-Teaser-Post erstellen', 'x'),
  ('rt-2', 'after_publish',  7, 'after',  'X-Post mit Reaktionen', 'x'),
  ('rt-3', 'after_publish', 14, 'after',  'Short aus Episode schneiden', NULL);

-- ─── Seed: Default caption templates ─────────────────────────────────────────
INSERT OR IGNORE INTO caption_templates (id, platform_slug, name, body) VALUES
  ('ct-1', 'x',         'Standard Episode', '🎙️ Neue Episode #{{episode_nummer}}: {{episode_titel}}

{{youtube_url}}

#EcksteinPodcast'),
  ('ct-2', 'instagram', 'Standard Episode', '{{episode_titel}} 🎙️

Neue Folge des Eckstein Podcasts ist live — jeden Sonntag um 18:00 Uhr.

Link in Bio | #EcksteinPodcast'),
  ('ct-3', 'x',         'Short Teaser', '🎬 {{episode_titel}} | Ep. {{episode_nummer}}

{{youtube_url}}

#EcksteinPodcast #Shorts');

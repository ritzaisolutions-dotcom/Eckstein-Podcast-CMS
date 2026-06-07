-- Rollup table for fast analytics reads (replaces DISTINCT ON over analytics_snapshots).
-- Safe to run on existing DBs: only creates analytics_latest + backfills from history.

CREATE TABLE IF NOT EXISTS "analytics_latest" (
	"content_id" text NOT NULL,
	"platform_id" integer NOT NULL,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"watch_time_sec" integer,
	"captured_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_latest_content_id_platform_id_pk" PRIMARY KEY("content_id","platform_id")
);

-- One-time backfill: latest snapshot per (content, platform)
INSERT INTO "analytics_latest" (
	"content_id",
	"platform_id",
	"views",
	"likes",
	"comments",
	"shares",
	"watch_time_sec",
	"captured_at",
	"updated_at"
)
SELECT DISTINCT ON (content_id, platform_id)
	content_id,
	platform_id,
	views,
	likes,
	comments,
	shares,
	watch_time_sec,
	captured_at,
	now()
FROM analytics_snapshots
ORDER BY content_id, platform_id, captured_at DESC
ON CONFLICT (content_id, platform_id) DO NOTHING;

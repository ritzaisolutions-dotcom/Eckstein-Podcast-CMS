interface CloudflareEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  CACHE: KVNamespace;
  ANALYTICS_QUEUE: Queue;
  // Secrets
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
  VAULT_MASTER_KEY: string;
  YOUTUBE_API_KEY: string;
  IG_ACCESS_TOKEN: string;
  IG_BUSINESS_ID: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  TELEGRAM_ALLOWED_CHAT_IDS: string;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  NODE_ENV: string;
}

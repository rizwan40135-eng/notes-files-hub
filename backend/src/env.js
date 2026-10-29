/**
 * Central environment configuration for the backend.
 *
 * DATABASE_URL is required: the server refuses to boot without it and never
 * falls back to demo data. All credentials stay server-side; nothing here is
 * ever shipped to the frontend.
 */

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `[config] Missing required environment variable: ${name}. ` +
        "Set it in the process environment (or a systemd unit / secret manager) and start again.",
    );
    process.exit(1);
  }
  return value;
}

const uploadStorage = process.env.UPLOAD_STORAGE === "s3" ? "s3" : "local";

if (uploadStorage === "s3" && !process.env.S3_BUCKET) {
  console.error("[config] UPLOAD_STORAGE=s3 requires S3_BUCKET to be set.");
  process.exit(1);
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  port: Number(process.env.PORT || 8081),
  /** Comma-separated list of allowed frontend origins, or "*" for any. */
  corsOrigin: process.env.CORS_ORIGIN || "*",
  uploadStorage,
  /** Directory used by the "local" upload storage mode. */
  dataDir: process.env.DATA_DIR || "./data/storage",
  /**
   * HMAC secret for signed local upload URLs. Falls back to a random
   * per-boot secret when unset, which means pending upload URLs are
   * invalidated on restart — set it explicitly in production.
   */
  uploadSigningSecret: process.env.UPLOAD_SIGNING_SECRET || "",
  uploadUrlTtlSeconds: Number(process.env.UPLOAD_URL_TTL_SECONDS || 900),
  s3: {
    bucket: process.env.S3_BUCKET || "",
    region: process.env.AWS_REGION || "us-east-1",
    prefix: (process.env.S3_PREFIX || "uploads").replace(/\/+$/, ""),
  },
};

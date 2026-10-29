import pg from "pg";

/** Creates the single Postgres pool used by every data read and write. */
export function createPool(databaseUrl) {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => {
    console.error("[db] Idle client error:", error.message);
  });
  return pool;
}

/**
 * Reusable service module for every backend API call.
 *
 * The base URL always comes from the VITE_API_BASE_URL environment variable —
 * it is never hardcoded. No AWS/DB credentials or other backend secrets live
 * here: this module only talks to the backend's own HTTP endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Note {
  id: string;
  name: string;
  description: string;
}

export interface HealthResult {
  healthy: boolean;
  /** Raw response body (or status text) for display. */
  detail: string;
}

function buildUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) {
    throw new Error(
      "VITE_API_BASE_URL is not configured. Set it to the backend API base URL before using the app.",
    );
  }
  return `${base.replace(/\/+$/, "")}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path), init);
  } catch (error) {
    throw new Error(
      `Could not reach the backend at ${new URL(buildUrl(path)).origin}. ${error instanceof Error ? error.message : "Network error."}`,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Request failed (${response.status} ${response.statusText}). ${body.slice(0, 200)}`.trim(),
    );
  }

  return (await response.json()) as T;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/** Normalizes whatever item shape the backend returns into a Note. */
function toNote(value: unknown): Note {
  const record = asRecord(value);
  const description = record["description"] ?? record["desc"] ?? record["body"] ?? "";
  return {
    id: String(record["id"] ?? record["_id"] ?? record["itemId"] ?? ""),
    name: String(record["name"] ?? record["title"] ?? "Untitled note"),
    description: typeof description === "string" ? description : JSON.stringify(description),
  };
}

/** GET {VITE_API_BASE_URL}/health */
export async function checkHealth(): Promise<HealthResult> {
  const response = await fetch(buildUrl("/health"));
  const text = (await response.text()).trim();
  if (!response.ok) {
    throw new Error(`Health check failed (${response.status} ${response.statusText}). ${text.slice(0, 200)}`.trim());
  }
  return { healthy: true, detail: text || "OK" };
}

/** GET {VITE_API_BASE_URL}/api/items */
export async function listItems(): Promise<Note[]> {
  const data = await request<unknown>("/api/items");
  const record = asRecord(data);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(record["items"])
      ? record["items"]
      : Array.isArray(record["data"])
        ? record["data"]
        : [];
  return rows.map(toNote);
}

/** POST {VITE_API_BASE_URL}/api/items with { name, description } */
export async function createItem(input: { name: string; description: string }): Promise<Note> {
  const data = await request<unknown>("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: input.name, description: input.description }),
  });
  return toNote(data);
}

export interface UploadUrlResult {
  uploadUrl: string;
}

/** POST {VITE_API_BASE_URL}/api/files/upload-url with { fileName, contentType } */
export async function requestUploadUrl(fileName: string, contentType: string): Promise<UploadUrlResult> {
  const data = await request<unknown>("/api/files/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, contentType }),
  });
  const record = asRecord(data);
  const url =
    record["uploadUrl"] ?? record["upload_url"] ?? record["url"] ?? record["signedUrl"] ?? record["signed_url"];
  if (typeof url !== "string" || !url) {
    throw new Error("The backend did not return an upload URL.");
  }
  return { uploadUrl: url };
}

/** PUT the file bytes directly to the signed upload URL returned by the backend. */
export async function uploadFileToUrl(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Upload failed (${response.status} ${response.statusText}). ${body.slice(0, 200)}`.trim(),
    );
  }
}

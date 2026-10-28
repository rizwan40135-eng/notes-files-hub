import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  CloudUpload,
  FileText,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import {
  checkHealth,
  createItem,
  listItems,
  requestUploadUrl,
  uploadFileToUrl,
  type Note,
} from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Notes & Files" },
      {
        name: "description",
        content: "Save notes and upload files through your backend API.",
      },
      { property: "og:title", content: "Notes & Files" },
      {
        property: "og:description",
        content: "Save notes and upload files through your backend API.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type HealthState =
  | { status: "checking" }
  | { status: "online"; detail: string }
  | { status: "offline"; detail: string };

type NotesState =
  | { status: "loading" }
  | { status: "ready"; notes: Note[] }
  | { status: "error"; detail: string };

type Message = { kind: "success" | "error"; text: string };

function StatusBanner({ message }: { message: Message }) {
  const isError = message.kind === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
      style={{
        borderColor: isError ? "var(--color-destructive)" : "var(--color-primary)",
        color: isError ? "var(--color-destructive)" : "var(--color-primary)",
        backgroundColor: isError ? "color-mix(in oklab, var(--color-destructive) 8%, transparent)" : "color-mix(in oklab, var(--color-primary) 8%, transparent)",
      }}
    >
      {isError ? <TriangleAlert className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
      <span>{message.text}</span>
    </p>
  );
}

function Index() {
  const [health, setHealth] = useState<HealthState>({ status: "checking" });
  const [notes, setNotes] = useState<NotesState>({ status: "loading" });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<Message | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHealth = useCallback(async () => {
    setHealth({ status: "checking" });
    try {
      const result = await checkHealth();
      setHealth({ status: "online", detail: result.detail });
    } catch (error) {
      setHealth({ status: "offline", detail: error instanceof Error ? error.message : "Unknown error." });
    }
  }, []);

  const loadNotes = useCallback(async () => {
    setNotes({ status: "loading" });
    try {
      const result = await listItems();
      setNotes({ status: "ready", notes: result });
    } catch (error) {
      setNotes({ status: "error", detail: error instanceof Error ? error.message : "Unknown error." });
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !description.trim()) {
      setSaveMessage({ kind: "error", text: "Please fill in both a title and a description." });
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      await createItem({ name: name.trim(), description: description.trim() });
      setSaveMessage({ kind: "success", text: `Note "${name.trim()}" saved.` });
      setName("");
      setDescription("");
      await loadNotes();
    } catch (error) {
      setSaveMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not save the note.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload() {
    if (!file) {
      setUploadMessage({ kind: "error", text: "Choose a file first." });
      return;
    }
    setUploading(true);
    setUploadMessage(null);
    try {
      const { uploadUrl } = await requestUploadUrl(
        file.name,
        file.type || "application/octet-stream",
      );
      await uploadFileToUrl(uploadUrl, file);
      setUploadMessage({ kind: "success", text: `File "${file.name}" uploaded successfully.` });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setUploadMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not upload the file.",
      });
    } finally {
      setUploading(false);
    }
  }

  const inputClasses =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const buttonClasses =
    "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notes &amp; Files</h1>
          <p className="text-sm text-muted-foreground">
            Save notes and upload files through your backend API.
          </p>
        </header>

        <section aria-labelledby="health-heading" className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="health-heading" className="text-sm font-semibold text-foreground">
              Backend status
            </h2>
            <button
              type="button"
              onClick={() => void loadHealth()}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </button>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm">
            {health.status === "checking" ? (
              <>
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Checking backend health…</span>
              </>
            ) : health.status === "online" ? (
              <>
                <CheckCircle2 className="size-4 text-primary" />
                <span className="text-foreground">Backend is healthy.</span>
                <span className="text-xs text-muted-foreground">{health.detail}</span>
              </>
            ) : (
              <>
                <TriangleAlert className="size-4 text-destructive" />
                <span className="text-destructive">Backend is unreachable.</span>
              </>
            )}
          </p>
          {health.status === "offline" && (
            <p className="mt-1 text-xs text-muted-foreground">{health.detail}</p>
          )}
        </section>

        <section aria-labelledby="new-note-heading" className="rounded-lg border border-border bg-card p-4">
          <h2 id="new-note-heading" className="text-sm font-semibold text-foreground">
            New note
          </h2>
          <form className="mt-3 flex flex-col gap-3" onSubmit={handleSave} noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="note-title" className="text-sm font-medium text-foreground">
                Title
              </label>
              <input
                id="note-title"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Note title"
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="note-description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="note-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Note description"
                rows={3}
                className={`${inputClasses} resize-y`}
              />
            </div>
            <div>
              <button type="submit" disabled={saving} className={buttonClasses}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving ? "Saving…" : "Save note"}
              </button>
            </div>
            {saveMessage && <StatusBanner message={saveMessage} />}
          </form>
        </section>

        <section aria-labelledby="upload-heading" className="rounded-lg border border-border bg-card p-4">
          <h2 id="upload-heading" className="text-sm font-semibold text-foreground">
            Upload a file
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className={buttonClasses} style={{ cursor: uploading ? "not-allowed" : "pointer" }}>
                <CloudUpload className="size-4" />
                Choose file
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <span className="text-sm text-muted-foreground">
                {file ? file.name : "No file selected"}
              </span>
              <button type="button" onClick={() => void handleUpload()} disabled={uploading || !file} className={buttonClasses}>
                {uploading && <Loader2 className="size-4 animate-spin" />}
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
            {uploadMessage && <StatusBanner message={uploadMessage} />}
          </div>
        </section>

        <section aria-labelledby="notes-heading" className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="notes-heading" className="text-sm font-semibold text-foreground">
              Saved notes
            </h2>
            <button
              type="button"
              onClick={() => void loadNotes()}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {notes.status === "loading" && (
              <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading notes…
              </p>
            )}
            {notes.status === "error" && (
              <p role="alert" className="flex items-start gap-2 py-2 text-sm text-destructive">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{notes.detail}</span>
              </p>
            )}
            {notes.status === "ready" && notes.notes.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                No notes yet. Save your first note above.
              </p>
            )}
            {notes.status === "ready" &&
              notes.notes.map((note) => (
                <article
                  key={note.id || note.name}
                  className="rounded-md border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">{note.name}</h3>
                  </div>
                  {note.description && (
                    <p className="mt-1 whitespace-pre-wrap pl-6 text-sm text-muted-foreground">
                      {note.description}
                    </p>
                  )}
                </article>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

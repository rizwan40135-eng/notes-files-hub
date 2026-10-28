import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createItem, requestUploadUrl, uploadFileToUrl } from "@/lib/api";

const fetchMock = vi.fn();

describe("api service", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("POSTs new notes as { name, description } to the configured base URL", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "1", name: "Groceries", description: "Milk and eggs" }), {
        status: 201,
      }),
    );

    const note = await createItem({ name: "Groceries", description: "Milk and eggs" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.com/api/items");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Groceries", description: "Milk and eggs" }));
    expect(note.name).toBe("Groceries");
  });

  it("GETs items from the configured base URL", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([{ id: "a1", name: "First", description: "Hello" }]), {
        status: 200,
      }),
    );

    await import("@/lib/api").then((m) => m.listItems());

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.com/api/items");
  });

  it("requests a signed upload URL with the file name and content type", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ uploadUrl: "https://storage.example.com/put-here" }), {
        status: 200,
      }),
    );

    const { uploadUrl } = await requestUploadUrl("report.pdf", "application/pdf");

    expect(uploadUrl).toBe("https://storage.example.com/put-here");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.com/api/files/upload-url");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ fileName: "report.pdf", contentType: "application/pdf" }));
  });

  it("PUTs the file bytes to the signed upload URL", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    await uploadFileToUrl("https://storage.example.com/put-here", file);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://storage.example.com/put-here");
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(file);
  });

  it("fails with a clear message when the base URL env var is missing", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");

    await expect(createItem({ name: "x", description: "y" })).rejects.toThrow(
      /VITE_API_BASE_URL is not configured/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

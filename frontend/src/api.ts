// frontend/src/api.ts

export type SupportedTargetFormat = "pdf" | "docx" | "pptx" | "xlsx" | "jpg" | "png";

/**
 * Decide backend base URL.
 * - If VITE_API_URL is set and NOT using "backend" hostname, use that.
 * - Otherwise, use the same host as the frontend and port 8000.
 */
const getBackendBaseUrl = (): string => {
  // Read from Vite env at build time
  const envUrl = import.meta.env.VITE_API_URL?.trim();

  if (envUrl && envUrl !== "" && !envUrl.includes("backend:8000")) {
    // Use explicit env URL if it doesn't point to Docker-internal hostname
    return envUrl.replace(/\/+$/, "");
  }

  // Default: same host as the page, port 8000
  const { protocol, hostname } = window.location;
  const port = "8000";
  return `${protocol}//${hostname}:${port}`;
};

const BACKEND_BASE_URL = getBackendBaseUrl();

console.log("[api] Using backend base URL:", BACKEND_BASE_URL);

export async function convertDocument(
  file: File,
  targetFormat: SupportedTargetFormat
): Promise<Blob> {
  const url = `${BACKEND_BASE_URL}/convert`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("target_format", targetFormat);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    // Network ok, but HTTP status not OK
    if (!response.ok) {
      const textBody = await response.text().catch(() => "");
      console.error("[api] Backend error response:", response.status, textBody);
      throw new Error(
        `Backend error ${response.status}${
          textBody ? `: ${textBody}` : ""
        }`
      );
    }

    // Success: return file blob
    const blob = await response.blob();
    return blob;
  } catch (err: any) {
    console.error("[api] Fetch failed:", err);
    // If it's a network/CORS/DNS error, fetch’s message is often "Failed to fetch"
    throw new Error(err?.message || "Failed to call backend");
  }
}



import { createHash } from "node:crypto";

export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const ALLOWED_HOST = /^[a-z0-9-]+\.files\.eu-south-1\.portaleargo\.it$/i;
const DOWNLOAD_TIMEOUT_MS = 30_000;

export type ArgoAttachment = {
  filename: string;
  mimeType: string;
  bytes: Buffer;
  sha256: string;
};

function safeFilename(value: string) {
  const clean = value
    .replace(/[\\/\x00-\x1f\x7f]/g, "_")
    .replace(/[<>:"|?*]/g, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 180);
  return clean || "allegato";
}

function filenameFromDisposition(header: string | null) {
  if (!header) return null;
  const extended = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (extended) {
    try { return decodeURIComponent(extended[1]); } catch { return null; }
  }
  return /filename\s*=\s*"([^"]+)"/i.exec(header)?.[1]
    ?? /filename\s*=\s*([^;]+)/i.exec(header)?.[1]?.trim()
    ?? null;
}

export function validateAttachmentUrl(signedUrl: string): URL {
  const url = new URL(signedUrl);
  if (
    url.protocol !== "https:" ||
    url.username || url.password || url.port ||
    !ALLOWED_HOST.test(url.hostname) ||
    !url.pathname.startsWith("/")
  ) {
    throw new Error("Attachment URL is not from the approved Argo file storage");
  }
  // URLs are signed by Argo/CloudFront, never return or log them.
  if (!url.searchParams.get("Signature") || !url.searchParams.get("Key-Pair-Id")) {
    throw new Error("Argo did not return a signed attachment URL");
  }
  const expires = Number(url.searchParams.get("Expires"));
  if (!Number.isSafeInteger(expires) || expires * 1000 <= Date.now()) {
    throw new Error("Argo attachment URL has already expired");
  }
  return url;
}

function detectMime(bytes: Buffer, name: string): string {
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "image/png";
  if (bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))) return "image/jpeg";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  const zip = bytes.subarray(0, 4).equals(Buffer.from("504b0304", "hex"));
  if (zip) {
    if (/\.docx$/i.test(name)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (/\.xlsx$/i.test(name)) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (/\.pptx$/i.test(name)) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (/\.zip$/i.test(name)) return "application/zip";
  }
  throw new Error("Unsupported or invalid Argo attachment content");
}

export async function fetchArgoAttachment(
  signedUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<ArgoAttachment> {
  const url = validateAttachmentUrl(signedUrl);
  const response = await fetcher(url, {
    method: "GET",
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Argo attachment download failed (HTTP ${response.status})`);

  const length = Number(response.headers.get("content-length") || "0");
  if (length > MAX_ATTACHMENT_BYTES) {
    await response.body?.cancel();
    throw new Error("Argo attachment exceeds the 15 MiB download limit");
  }

  const disposition =
    response.headers.get("content-disposition") ??
    url.searchParams.get("response-content-disposition");
  const filename = safeFilename(filenameFromDisposition(disposition) ?? "allegato");
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (!response.body) throw new Error("Argo attachment response has no body");
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_ATTACHMENT_BYTES) throw new Error("Argo attachment exceeds the 15 MiB download limit");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = Buffer.concat(chunks, total);
  const mimeType = detectMime(bytes, filename);
  return {
    filename,
    mimeType,
    bytes,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export function attachmentToolResult(attachment: ArgoAttachment, uid: string, scope: "notice" | "student") {
  return {
    content: [
      {
        type: "text" as const,
        text: `File recuperato da Argo: ${attachment.filename} (${attachment.bytes.length} byte, ${attachment.mimeType}, SHA-256 ${attachment.sha256}). Il documento binario e' incluso come risorsa MCP. Non utilizzare URL temporanei.`,
      },
      {
        type: "resource" as const,
        resource: {
          uri: `argo-attachment://${scope}/${encodeURIComponent(uid)}/${encodeURIComponent(attachment.filename)}`,
          mimeType: attachment.mimeType,
          blob: attachment.bytes.toString("base64"),
        },
        annotations: { audience: ["user", "assistant"] as ("user" | "assistant")[], priority: 1 },
      },
    ],
  };
}

import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_ATTACHMENT_BYTES, attachmentToolResult,
  fetchArgoAttachment, validateAttachmentUrl,
} from "../src/attachment.js";

function signedUrl(expires = Math.floor(Date.now() / 1000) + 180, file = "circolare.pdf") {
  const url = new URL("https://files123.files.eu-south-1.portaleargo.it/SC/WSX/BACHECA/2026/file");
  url.searchParams.set("Expires", String(expires));
  url.searchParams.set("Signature", "fake-for-local-test");
  url.searchParams.set("Key-Pair-Id", "test");
  url.searchParams.set("response-content-disposition", 'inline;filename="' + file + '"');
  return url.href;
}
const pdf = Buffer.from("%PDF-1.7\n%test\n1 0 obj\n");
const fakeFetch = (body: Uint8Array, headers: Record<string, string> = {}) =>
  (async (_url: URL | RequestInfo, init?: RequestInit) => {
    assert.equal(init?.redirect, "error");
    return new Response(body, { status: 200, headers });
  }) as unknown as typeof fetch;

test("downloads valid PDF, sanitizes filename, and returns MCP base64 embedded resource", async () => {
  const result = await fetchArgoAttachment(signedUrl(undefined, "../circolare.pdf"), fakeFetch(pdf));
  assert.equal(result.filename, "_circolare.pdf");
  assert.equal(result.mimeType, "application/pdf");
  assert.deepEqual(result.bytes, pdf);
  const payload = attachmentToolResult(result, "uid-example", "notice");
  assert.equal(payload.content[1].type, "resource");
  assert.equal(payload.content[1].resource.mimeType, "application/pdf");
  assert.deepEqual(Buffer.from(payload.content[1].resource.blob, "base64"), pdf);
  assert.ok(!JSON.stringify(payload).includes("Signature="));
});

test("rejects an expired link before requesting content", () => {
  assert.throws(() => validateAttachmentUrl(signedUrl(Math.floor(Date.now() / 1000) - 1)), /expired/);
});

test("rejects a forged external host and missing signed query", () => {
  assert.throws(() => validateAttachmentUrl(signedUrl().replace("files123.files.eu-south-1.portaleargo.it", "files.evil.example")), /approved/);
  assert.throws(() => validateAttachmentUrl("https://files123.files.eu-south-1.portaleargo.it/SC/WSX/BACHECA/2026/file"), /signed/);
});

test("rejects successful HTTP HTML instead of a document", async () => {
  await assert.rejects(
    fetchArgoAttachment(signedUrl(), fakeFetch(Buffer.from("<html>Access Denied</html>"), { "content-type": "text/html" })),
    /Unsupported or invalid/,
  );
});

test("rejects oversized announced content without downloading", async () => {
  await assert.rejects(
    fetchArgoAttachment(signedUrl(), fakeFetch(pdf, { "content-length": String(MAX_ATTACHMENT_BYTES + 1) })),
    /exceeds/,
  );
});

test("rejects oversized streamed content without announcing length", async () => {
  const oversized = Buffer.alloc(MAX_ATTACHMENT_BYTES + 1, 42);
  await assert.rejects(fetchArgoAttachment(signedUrl(), fakeFetch(oversized)), /exceeds/);
});

test("rejects redirect responses and keeps URLs out of errors", async () => {
  await assert.rejects(
    fetchArgoAttachment(signedUrl(), (async () => new Response(null, { status: 302 })) as typeof fetch),
    /HTTP 302/,
  );
});

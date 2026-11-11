/**
 * Argo may render its OAuth consent continuation as a link in an HTML 200
 * response instead of issuing an HTTP redirect.
 */
export function getArgoConsentUrl(html, loginLink) {
  const anchors = html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi);
  for (const [, , encodedHref] of anchors) {
    const href = encodedHref.replace(/&amp;/gi, "&");
    let url;
    try { url = new URL(href); } catch { continue; }
    if (url.protocol !== "https:" || url.hostname !== "auth.portaleargo.it" || url.pathname !== "/oauth2/auth") continue;
    if (!url.searchParams.has("consent_verifier")) continue;
    if (url.searchParams.get("client_id") !== loginLink.clientId) continue;
    if (url.searchParams.get("state") !== loginLink.state) continue;
    if (url.searchParams.get("redirect_uri") !== loginLink.redirectUri) continue;
    return url.href;
  }
  throw new Error("Invalid Argo OAuth consent page");
}

export function getArgoAuthorizationCode(location, loginLink) {
  if (typeof location !== "string") throw new Error("Invalid login redirect");
  const callback = new URL(location);
  const expected = new URL(loginLink.redirectUri);
  if (callback.protocol !== expected.protocol || callback.hostname !== expected.hostname || callback.pathname !== expected.pathname) {
    throw new Error("Unexpected Argo OAuth callback");
  }
  if (callback.searchParams.get("state") !== loginLink.state) throw new Error("Invalid Argo OAuth state");
  const code = callback.searchParams.get("code");
  if (!code) throw new Error("Invalid login code");
  return code;
}

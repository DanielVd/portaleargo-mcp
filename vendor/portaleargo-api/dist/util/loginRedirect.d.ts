import type { LoginLink } from "../types";
/** Extract and validate an OAuth consent continuation from Argo HTML. */
export declare function getArgoConsentUrl(html: string, loginLink: LoginLink): string;
/** Validate the callback origin, path and OAuth state before using its code. */
export declare function getArgoAuthorizationCode(location: string | undefined, loginLink: LoginLink): string;

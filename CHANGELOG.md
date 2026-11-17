# Changelog

## 0.3.0 - 2026-11-17

### Added

- Embedded MCP resource delivery for Argo attachments through `download_notice_attachment` and `download_student_attachment`, replacing short-lived signed links.
- Targeted upstream Argo HTTP 5xx and transport-failure diagnostics, without logging credentials, tokens or signed query parameters.
- A contributor guide with the GitHub-linked Codex co-author trailer and pull request validation conventions.

### Fixed

- Support the current Argo OAuth consent continuation and update the advertised didUp client version.
- Avoid the unreliable legacy `/appfamiglia/api/rest/login` endpoint for supported Famiglia profile, timetable, homework, bulletin, meeting and related MCP operations.
- Safeguard attachment downloads against untrusted hosts, redirects, excessive size, expired signatures and unexpected MIME content.
- Update the vendored API and transitive dependencies to address production audit findings.

### Changed

- Continue to support historical `login()` consumers; use the modern `loginFamiglia()` session for migrated MCP operations.
- Keep the permission-dependent PCTO fallback where the modern endpoint was not validated for this school.
- Maintain backwards-compatible attachment tool aliases that now return embedded files.
- Standardize GitHub issue and PR documentation.

### Validation

- CI runs `npm ci`, production dependency audit, build and the automated test suite.
- The 14-test MCP suite and 11 live read-only Argo integration checks passed during the November remediation.
- Live state-changing tests were not rerun for this release; the manual mutation E2E remains explicit opt-in.

## 0.2.0 - 2026-09-19

### Added

- Famiglia API-backed tools for profile, schedule, notice board, student documents, curriculum, taxes, receipts, meetings, recovery courses, and scrutiny data.
- Mutating MCP tools for generic bulletin read confirmation, student-document read confirmation, bulletin adhesion, disciplinary-note read confirmation, and attendance justification.
- Manual real-backend mutation E2E over MCP STDIO for safe already-read records.
- Production dependency audit gate for high-severity runtime advisories.

### Changed

- Vendored `portaleargo-api` is aligned to release 1.1.0.
- Runtime requirement is Node.js 20.18.1 or newer.
- Generic bulletin read confirmation now transparently downloads a required attachment before confirming read status.
- Mutation tool descriptions and safety guidance now match the verified Famiglia backend behavior.

### Validation

- MCP build and test suite: required before release.
- Production dependency audit: required before release.
- Generic bulletin read confirmation through MCP: validated against the real Famiglia backend.
- Student-document read confirmation through MCP: validated by the manual release E2E.

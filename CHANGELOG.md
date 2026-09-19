# Changelog

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

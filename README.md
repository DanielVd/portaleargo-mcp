# portaleargo-mcp

[![Latest Release](https://img.shields.io/github/v/release/DanielVd/portaleargo-mcp)](https://github.com/DanielVd/portaleargo-mcp/releases/latest)

MCP server for Portale Argo workflows, backed by the official Famiglia API through `portaleargo-api`.

**Current GitHub release:** [v0.2.0](https://github.com/DanielVd/portaleargo-mcp/releases/tag/v0.2.0) (2026-09-19). It contains the vendored build of [portaleargo-api v1.1.0](https://github.com/DanielVd/portaleargo-api/releases/tag/v1.1.0); see [CHANGELOG.md](CHANGELOG.md) for the release history.

This release is published on **GitHub, not npm**. The project contains a local `file:vendor/portaleargo-api` dependency, so build from the checked-out repository rather than trying to install `portaleargo-mcp` from npm.

## Requirements

- Node.js 20.18.1+
- an Argo Famiglia account
- school code, username, and password

## Configuration

Set the credentials only in the server environment:

```bash
export ARGO_SCHOOL_CODE="..."
export ARGO_USERNAME="..."
export ARGO_PASSWORD="..."
```

Do not put credentials in tool arguments, source files, logs, or repository configuration.

## Installation

```bash
git clone --branch v0.2.0 --depth 1 https://github.com/DanielVd/portaleargo-mcp.git
cd portaleargo-mcp
npm ci
npm run build
```

Set the three Argo environment variables shown above **before starting the MCP server**. Do not copy them into the repository.

The project vendors the generated `dist/` of the canonical `DanielVd/portaleargo-api` repository under `vendor/portaleargo-api`. The bundled package is labeled `1.1.0-github-snapshot` to distinguish it from a separately published npm package; its code is aligned with the API v1.1.0 GitHub release.

The API repository is the source of truth. Changes to the vendored library should be produced by building the canonical API and synchronizing the generated `dist/`, not by hand-editing generated files.

## Running

STDIO MCP server:

```bash
npm start
```

HTTP transport:

```bash
npm run start:http
```

Development variants:

```bash
npm run dev
npm run dev:http
```

The HTTP server defaults to `0.0.0.0:3000` with the MCP endpoint at `/mcp` and an unauthenticated health endpoint at `/health`. The current HTTP implementation does **not** authenticate incoming MCP or REST requests, and some REST routes return school data or signed attachment URLs. **Do not expose the HTTP listener directly to the Internet or an untrusted network.** For local-only operation, set `MCP_HTTP_HOST=127.0.0.1`; any remote deployment requires a separate, access-controlled front end and appropriate network restrictions.

## Read-only tools

The server exposes tools for:

- homework and schedule
- profile and profile details
- notice-board and student-document history
- authenticated attachment links
- curriculum
- scrutiny grades
- taxes and payment receipts
- recovery courses
- teacher meetings and teacher availability
- PCTO where supported by the school

The MCP no longer calls legacy mutation endpoints directly; mutations are delegated to the canonical `portaleargo-api` client.

## Mutating tools

These tools change data in Argo and must be invoked deliberately:

```text
confirm_bacheca_notice_read
confirm_student_notice_read
toggle_bacheca_notice_adhesion
confirm_disciplinary_note_read
justify_attendance_events
```

`confirm_bacheca_notice_read` does not require callers to pass an attachment UID. The canonical API resolves an attachment from the notice, downloads it, and only then confirms read status because the Famiglia backend requires at least one attachment download.

`toggle_bacheca_notice_adhesion` is intentionally named as a toggle: calling it again can remove an already-confirmed adhesion.

The two read-confirmation tools were validated through the real MCP STDIO protocol and Famiglia backend for **already-read** records. Adhesion, disciplinary-note acknowledgment and attendance justification are implemented but **have not been validated end-to-end using applicable real records**. A successful unit-test run does not establish that these live mutations will succeed in every school.

Automated CI does not execute mutating tools.

A separate `Manual Famiglia mutation E2E` GitHub Actions workflow is available through `workflow_dispatch`. It requires the explicit acknowledgement `RUN_MUTATION_E2E`, starts the built MCP server over STDIO, and validates the real MCP protocol path for both `confirm_bacheca_notice_read` and `confirm_student_notice_read`. It selects only already-read records, invokes the mutations, and re-reads the corresponding data to verify `isPresaVisione=true`, so the probe does not turn an unread record into a read one.

## PCTO

PCTO remains available through the compatibility path exposed by `portaleargo-api`.

The official Famiglia PCTO endpoint is permission-dependent. On the account used during migration it returns HTTP 403 because the feature is not enabled by the school, so the MCP does not pretend that a Famiglia PCTO payload has been verified.

## Famiglia migration notes

The vendored API uses the Famiglia backend for the migrated application methods, including read-only data, notice confirmations, adhesion, disciplinary-note confirmation, and attendance justification. The last three mutations are not yet validated end-to-end on applicable live records.

Some authentication lifecycle internals remain as a compatibility layer in `portaleargo-api` so existing callers of the historical `login()` flow are not broken. MCP tools do not need to call legacy mutation endpoints themselves.

## Validation

For pull requests to `main`, the required `CI / test` job performs `npm ci`, `npm audit --omit=dev --audit-level=high`, a syntax check of `scripts/e2e-mcp-mutations.mjs`, `npm run build`, and `npm test`. Tests verify the registered MCP tool surface in addition to homework and schedule transformations.

The live-mutation workflow is **manual only**: from GitHub Actions, select `Manual Famiglia mutation E2E`, enter `RUN_MUTATION_E2E`, and run it on `main`. It uses the `ARGO_SCHOOL_CODE`, `ARGO_USERNAME`, and `ARGO_PASSWORD` Actions secrets, selects already-read records, invokes both read-confirmation tools over STDIO, and re-reads their states. It must not be enabled as a routine push/PR check.

Both read-confirmation paths passed the manual pre-release E2E for [v0.2.0](https://github.com/DanielVd/portaleargo-mcp/releases/tag/v0.2.0). The `v0.2.0` tag remains fixed; documentation changes on `main` after publication do not alter its source archive.

## Safety

Read operations may expose school data returned by the authenticated account. Mutating tools can change read status, adhesion, disciplinary-note status, or attendance justifications.

Clients should surface the intended mutation clearly before invoking a mutating tool and should not execute these tools as part of background/read-only health checks.

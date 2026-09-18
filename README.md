# portaleargo-mcp

[![Latest Release](https://img.shields.io/github/v/release/DanielVd/portaleargo-mcp)](https://github.com/DanielVd/portaleargo-mcp/releases/latest)

MCP server for Portale Argo workflows, backed by the official Famiglia API through `portaleargo-api`.

## Requirements

- Node.js 20+
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
npm ci
npm run build
```

The project vendors the generated `dist/` of the canonical `DanielVd/portaleargo-api` repository under `vendor/portaleargo-api`.

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

Automated CI does not execute mutating tools.

A separate `Manual Famiglia mutation E2E` GitHub Actions workflow is available through `workflow_dispatch`. It requires the explicit acknowledgement `RUN_MUTATION_E2E`, starts the built MCP server over STDIO, selects an already-read bulletin with an attachment, invokes `confirm_bacheca_notice_read` through the MCP protocol, and re-reads the bulletin to verify `isPresaVisione=true`. It therefore exercises the production chain without changing an unread notice to read.

## PCTO

PCTO remains available through the compatibility path exposed by `portaleargo-api`.

The official Famiglia PCTO endpoint is permission-dependent. On the account used during migration it returns HTTP 403 because the feature is not enabled by the school, so the MCP does not pretend that a Famiglia PCTO payload has been verified.

## Famiglia migration notes

The vendored API uses the Famiglia backend for the application methods that have been verified, including read-only data, notice confirmations, adhesion, disciplinary-note confirmation, and attendance justification.

Some authentication lifecycle internals remain as a compatibility layer in `portaleargo-api` so existing callers of the historical `login()` flow are not broken. MCP tools do not need to call legacy mutation endpoints themselves.

## Validation

CI runs:

```bash
npm ci
npm run build
npm test
```

Tests verify the registered MCP tool surface in addition to the homework and schedule transformations.

## Safety

Read operations may expose school data returned by the authenticated account. Mutating tools can change read status, adhesion, disciplinary-note status, or attendance justifications.

Clients should surface the intended mutation clearly before invoking a mutating tool and should not execute these tools as part of background/read-only health checks.

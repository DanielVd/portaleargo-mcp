# portaleargo-mcp

Read-only MCP server for Argo ScuolaNext built in TypeScript. Uses [`portaleargo-api`](https://github.com/DTrombett/portaleargo-api) as backend and exposes:

- MCP over STDIO
- MCP over streamable HTTP
- small REST API for direct HTTP integrations

## Requirements

- Node.js 20+
- Argo credentials on server

## Environment

Create `.env` from template:

```bash
cp .env.example .env
```

Set:

- `ARGO_SCHOOL_CODE`
- `ARGO_USERNAME`
- `ARGO_PASSWORD`
- optional: `MCP_HTTP_HOST`
- optional: `MCP_HTTP_PORT`
- optional: `MCP_HTTP_PATH`

## Install

```bash
npm install
```

[`portaleargo-api`](https://github.com/DTrombett/portaleargo-api) is vendored because direct git install was not reliable for this project setup.

## Run

STDIO:

```bash
npm run dev
npm start
```

HTTP:

```bash
npm run dev:http
npm run start:http
```

Build:

```bash
npm run build
```

Test:

```bash
npm test
```

## MCP

### STDIO

```json
{
  "mcpServers": {
    "argo-homework": {
      "command": "node",
      "args": ["/absolute/path/to/argo-homework-mcp/dist/index.js"],
      "env": {
        "ARGO_SCHOOL_CODE": "SS00000",
        "ARGO_USERNAME": "your-argo-username",
        "ARGO_PASSWORD": "your-argo-password"
      }
    }
  }
}
```

### Streamable HTTP

Default URL:

```text
http://HOST:3000/mcp
```

LibreChat example:

```yaml
mcpSettings:
  allowedDomains:
    - "HOST_OR_IP"

mcpServers:
  argo-homework:
    type: streamable-http
    url: http://HOST_OR_IP:3000/mcp
```

## MCP tools

- `get_tomorrow_homework`
- `get_homework_for_date`
- `get_tomorrow_schedule`
- `get_schedule_for_date`
- `get_profile_summary`
- `get_profile_details`
- `get_notice_attachment_link`
- `get_student_attachment_link`
- `get_payment_receipt`
- `get_scrutiny_grades`
- `get_meetings`
- `get_taxes`
- `get_pcto`
- `get_recovery_courses`
- `get_curriculum`
- `get_notice_board_history`
- `get_student_notice_board_history`

## REST endpoints

- `GET /health`
- `GET /api/profile/summary`
- `GET /api/profile/details`
- `GET /api/homework/tomorrow`
- `GET /api/homework/:date`
- `GET /api/schedule/tomorrow`
- `GET /api/schedule/:date`
- `GET /api/meetings`
- `GET /api/scrutiny-grades`
- `GET /api/taxes?pkScheda=...`
- `GET /api/pcto?pkScheda=...`
- `GET /api/recovery-courses?pkScheda=...`
- `GET /api/curriculum?pkScheda=...`
- `GET /api/notice-board/history?pkScheda=...`
- `GET /api/student-notice-board/history?pkScheda=...`
- `GET /api/attachments/notice/:uid`
- `GET /api/attachments/student/:uid?pkScheda=...`
- `GET /api/payment-receipt/:iuv`

Dates must be `YYYY-MM-DD`.

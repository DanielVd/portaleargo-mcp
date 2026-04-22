# portaleargo-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

Read-only MCP server for **Argo ScuolaNext** built in TypeScript. Exposes homework, timetables, grades, meetings, taxes, PCTO, and more through three interfaces:

- **MCP over STDIO** — Claude Desktop, Claude Code, any MCP-compatible client
- **MCP over streamable HTTP** — LibreChat, remote clients
- **REST API** — direct HTTP integrations

Built on top of [`portaleargo-api`](https://github.com/DTrombett/portaleargo-api) by [@DTrombett](https://github.com/DTrombett).

## Table of contents

- [Requirements](#requirements)
- [Setup](#setup)
- [Running](#running)
- [MCP client configuration](#mcp-client-configuration)
- [MCP tools](#mcp-tools)
- [REST endpoints](#rest-endpoints)
- [Tests](#tests)
- [Contributing](#contributing)
- [License](#license)

## Requirements

- Node.js 20+
- An Argo ScuolaNext account (student or parent)

## Setup

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `ARGO_SCHOOL_CODE` | yes | | School code (e.g. `SS00000`) |
| `ARGO_USERNAME` | yes | | Argo username |
| `ARGO_PASSWORD` | yes | | Argo password |
| `MCP_HTTP_HOST` | no | `0.0.0.0` | HTTP bind address |
| `MCP_HTTP_PORT` | no | `3000` | HTTP port |
| `MCP_HTTP_PATH` | no | `/mcp` | MCP endpoint path |

```bash
npm install
npm run build
```

> `portaleargo-api` is vendored under `vendor/` because direct git install was not reliable for this project setup.

## Running

| Mode | Dev | Production |
|---|---|---|
| STDIO | `npm run dev` | `npm start` |
| HTTP | `npm run dev:http` | `npm run start:http` |

## MCP client configuration

### STDIO (Claude Desktop / Claude Code)

```json
{
  "mcpServers": {
    "portaleargo": {
      "command": "node",
      "args": ["/absolute/path/to/portaleargo-mcp/dist/index.js"],
      "env": {
        "ARGO_SCHOOL_CODE": "SS00000",
        "ARGO_USERNAME": "your-username",
        "ARGO_PASSWORD": "your-password"
      }
    }
  }
}
```

### Streamable HTTP (LibreChat)

```yaml
mcpSettings:
  allowedDomains:
    - "YOUR_HOST_OR_IP"

mcpServers:
  portaleargo:
    type: streamable-http
    url: http://YOUR_HOST_OR_IP:3000/mcp
```

## MCP tools

| Tool | Input | Description |
|---|---|---|
| `get_tomorrow_homework` | (none) | Homework due tomorrow (Europe/Rome) |
| `get_homework_for_date` | `date: YYYY-MM-DD` | Homework due on a specific date |
| `get_tomorrow_schedule` | (none) | School timetable for tomorrow |
| `get_schedule_for_date` | `date: YYYY-MM-DD` | School timetable for a specific date |
| `get_profile_summary` | (none) | Student name, class, school, guardian |
| `get_profile_details` | (none) | Full student and guardian profile |
| `get_scrutiny_grades` | (none) | Period grades / scrutiny results |
| `get_meetings` | (none) | Teacher meeting slots and bookings |
| `get_taxes` | `pkScheda?` | School fees and payments |
| `get_pcto` | `pkScheda?` | PCTO (work-school alternation) data |
| `get_recovery_courses` | `pkScheda?` | Recovery course records |
| `get_curriculum` | `pkScheda?` | Student curriculum |
| `get_notice_board_history` | `pkScheda?` | School notice board history |
| `get_student_notice_board_history` | `pkScheda?` | Student-specific notice board history |
| `get_notice_attachment_link` | `uid` | Download URL for a notice attachment |
| `get_student_attachment_link` | `uid`, `pkScheda?` | Download URL for a student attachment |
| `get_payment_receipt` | `iuv` | Payment receipt by IUV code |

`pkScheda` is optional for all tools that accept it. When omitted it defaults to the primary student on the account.

## REST endpoints

All dates must be `YYYY-MM-DD`.

```
GET /health
GET /api/profile/summary
GET /api/profile/details
GET /api/homework/tomorrow
GET /api/homework/:date
GET /api/schedule/tomorrow
GET /api/schedule/:date
GET /api/meetings
GET /api/scrutiny-grades
GET /api/taxes?pkScheda=...
GET /api/pcto?pkScheda=...
GET /api/recovery-courses?pkScheda=...
GET /api/curriculum?pkScheda=...
GET /api/notice-board/history?pkScheda=...
GET /api/student-notice-board/history?pkScheda=...
GET /api/attachments/notice/:uid
GET /api/attachments/student/:uid?pkScheda=...
GET /api/payment-receipt/:iuv
```

## Tests

```bash
npm test
```

## Contributing

Issues and pull requests are welcome. For significant changes please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE) - Copyright (c) 2026 Daniel Vedovato

---

Powered by [`portaleargo-api`](https://github.com/DTrombett/portaleargo-api) by [@DTrombett](https://github.com/DTrombett).

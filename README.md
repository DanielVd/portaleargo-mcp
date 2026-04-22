# portaleargo-mcp

Read-only MCP server for **Argo ScuolaNext** built in TypeScript. Wraps [`portaleargo-api`](https://github.com/DTrombett/portaleargo-api) and exposes the data through three interfaces:

- MCP over STDIO (Claude Desktop, Claude Code, any MCP client)
- MCP over streamable HTTP (LibreChat, remote clients)
- REST API for direct HTTP integrations

## Requirements

- Node.js 20+
- An Argo ScuolaNext account (student or parent)

## Setup

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
|---|---|---|
| `ARGO_SCHOOL_CODE` | yes | School code (e.g. `SS00000`) |
| `ARGO_USERNAME` | yes | Argo username |
| `ARGO_PASSWORD` | yes | Argo password |
| `MCP_HTTP_HOST` | no | HTTP bind address (default: `0.0.0.0`) |
| `MCP_HTTP_PORT` | no | HTTP port (default: `3000`) |
| `MCP_HTTP_PATH` | no | MCP endpoint path (default: `/mcp`) |

```bash
npm install
npm run build
```

> `portaleargo-api` is vendored under `vendor/` because direct git install was not reliable for this project setup. Source: [`DTrombett/portaleargo-api`](https://github.com/DTrombett/portaleargo-api) (MIT).

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
| `get_tomorrow_homework` | — | Homework due tomorrow (Europe/Rome) |
| `get_homework_for_date` | `date: YYYY-MM-DD` | Homework due on a specific date |
| `get_tomorrow_schedule` | — | School timetable for tomorrow |
| `get_schedule_for_date` | `date: YYYY-MM-DD` | School timetable for a specific date |
| `get_profile_summary` | — | Student name, class, school, guardian |
| `get_profile_details` | — | Full student and guardian profile |
| `get_scrutiny_grades` | — | Period grades / scrutiny results |
| `get_meetings` | — | Teacher meeting slots and bookings |
| `get_taxes` | `pkScheda?` | School fees and payments |
| `get_pcto` | `pkScheda?` | PCTO (work-school alternation) data |
| `get_recovery_courses` | `pkScheda?` | Recovery course records |
| `get_curriculum` | `pkScheda?` | Student curriculum |
| `get_notice_board_history` | `pkScheda?` | School notice board history |
| `get_student_notice_board_history` | `pkScheda?` | Student-specific notice board history |
| `get_notice_attachment_link` | `uid` | Download URL for a notice attachment |
| `get_student_attachment_link` | `uid`, `pkScheda?` | Download URL for a student attachment |
| `get_payment_receipt` | `iuv` | Payment receipt by IUV code |

`pkScheda` is optional for all tools that accept it — when omitted it defaults to the primary student on the account.

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

## License

MIT

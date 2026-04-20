# argo-homework-mcp

Minimal read-only MCP server in TypeScript that logs into Argo at startup and exposes one STDIO tool: `get_tomorrow_homework`.

## Requirements

- Node.js 20+
- Argo credentials available on the server

## Environment variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Set:

- `ARGO_SCHOOL_CODE`
- `ARGO_USERNAME`
- `ARGO_PASSWORD`

The server reads credentials only from environment variables. It does not expose authentication through MCP.

## Install dependencies

```bash
npm install
```

`portaleargo-api` is included as a local vendored snapshot built from the GitHub repository `DTrombett/portaleargo-api` (snapshot commit used for this MVP: `ca4b54e3fb05045969d1e3c75ca745a86d9423d8`). This avoids the upstream git install issue while still using the real library code and types.

## Run in development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Run the built server

```bash
npm start
```

## Test

```bash
npm test
```

## MCP client configuration via STDIO

Example configuration for a compatible MCP client:

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

## Tool

### `get_tomorrow_homework`

- input: none
- behavior: calculates tomorrow in `Europe/Rome`, refreshes Argo dashboard data, filters `dashboard.registro[*].compiti[*].dataConsegna`
- output:

```json
{
  "date": "YYYY-MM-DD",
  "items": [
    {
      "subject": "...",
      "teacher": "...",
      "assignment": "...",
      "due_date": "...",
      "hour": "...",
      "activity": "..."
    }
  ],
  "count": 0
}
```

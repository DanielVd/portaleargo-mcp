import "dotenv/config";
import { createServer as createHttpServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";
import { ZodError } from "zod";
import { getScheduleForDate, readArgoEnv, refreshDashboard } from "./argo.js";
import { createServer } from "./index.js";
import { getHomeworkForDate, getTomorrowDateInRome } from "./tools/getTomorrowHomework.js";
import { extractScheduleForDate } from "./tools/getTomorrowSchedule.js";

const host = process.env.MCP_HTTP_HOST ?? "0.0.0.0";
const port = Number(process.env.MCP_HTTP_PORT ?? "3000");
const mcpPath = process.env.MCP_HTTP_PATH ?? "/mcp";

function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/homework/tomorrow", async (_req, res) => {
    try {
      const dashboard = await refreshDashboard();
      const result = getHomeworkForDate(dashboard.registro, getTomorrowDateInRome());
      res.json(result);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/homework/:date", async (req, res) => {
    try {
      const dashboard = await refreshDashboard();
      const result = getHomeworkForDate(dashboard.registro, req.params.date);
      res.json(result);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/schedule/tomorrow", async (_req, res) => {
    try {
      const targetDate = getTomorrowDateInRome();
      const schedule = await getScheduleForDate(targetDate);
      res.json(extractScheduleForDate(schedule, targetDate));
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.post(mcpPath, async (req: Request, res: Response) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    } finally {
      await transport.close().catch(() => undefined);
      await server.close().catch(() => undefined);
    }
  });

  app.all(mcpPath, (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });

  return app;
}

function handleApiError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Invalid date format",
      message: "Use YYYY-MM-DD",
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({
    error: "Could not load homework",
    message,
  });
}

async function main() {
  readArgoEnv();

  const app = createApp();
  const httpServer = createHttpServer(app);

  httpServer.listen(port, host, () => {
    console.error(`argo-homework-mcp streamable-http ready at http://${host}:${port}${mcpPath}`);
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown server error";
  console.error(`Failed to start HTTP server: ${message}`);
  process.exit(1);
});

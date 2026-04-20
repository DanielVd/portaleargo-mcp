import "dotenv/config";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readArgoEnv, refreshDashboard } from "./argo.js";
import {
  extractHomeworkDueOnDate,
  formatHomeworkSummary,
  getTomorrowDateInRome,
  getTomorrowHomeworkOutputSchema,
} from "./tools/getTomorrowHomework.js";
import {
  extractScheduleForDate,
  formatScheduleSummary,
  getTomorrowScheduleOutputSchema,
} from "./tools/getTomorrowSchedule.js";
import { getScheduleForDate } from "./argo.js";

export function createServer() {
  const server = new McpServer({
    name: "argo-homework-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "get_tomorrow_homework",
    {
      description: "Get homework due tomorrow from Argo in Europe/Rome timezone.",
      inputSchema: z.object({}),
      outputSchema: getTomorrowHomeworkOutputSchema,
    },
    async () => {
      const dashboard = await refreshDashboard();
      const targetDate = getTomorrowDateInRome();
      const result = extractHomeworkDueOnDate(dashboard.registro, targetDate);

      return {
        content: [
          {
            type: "text",
            text: formatHomeworkSummary(result),
          },
        ],
        structuredContent: result,
      };
    },
  );

  server.registerTool(
    "get_tomorrow_schedule",
    {
      description: "Get tomorrow's school subjects from Argo in Europe/Rome timezone.",
      inputSchema: z.object({}),
      outputSchema: getTomorrowScheduleOutputSchema,
    },
    async () => {
      const targetDate = getTomorrowDateInRome();
      const schedule = await getScheduleForDate(targetDate);
      const result = extractScheduleForDate(schedule, targetDate);

      return {
        content: [
          {
            type: "text",
            text: formatScheduleSummary(result),
          },
        ],
        structuredContent: result,
      };
    },
  );

  return server;
}

export async function main() {
  // Fail fast on missing env vars, but keep Argo login lazy for tool calls.
  readArgoEnv();

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("argo-homework-mcp ready on STDIO");
}

const entrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;

if (entrypoint && import.meta.url === entrypoint) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error(`Failed to start server: ${message}`);
    process.exit(1);
  });
}

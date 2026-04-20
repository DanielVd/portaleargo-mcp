import "dotenv/config";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getCurriculumData,
  getDefaultPkScheda,
  getMeetings,
  getNoticeAttachmentLink,
  getNoticeBoardHistory,
  getPaymentReceipt,
  getPcto,
  getProfile,
  getProfileDetails,
  getRecoveryCourses,
  getScheduleForDate,
  getScrutinyGrades,
  getStudentAttachmentLink,
  getStudentNoticeBoardHistory,
  getTaxes,
  readArgoEnv,
  refreshDashboard,
} from "./argo.js";
import {
  extractHomeworkDueOnDate,
  formatHomeworkSummary,
  getHomeworkForDate,
  isoDateSchema,
  getTomorrowDateInRome,
  getTomorrowHomeworkOutputSchema,
} from "./tools/getTomorrowHomework.js";
import {
  extractScheduleForDate,
  formatScheduleSummary,
  getTomorrowScheduleOutputSchema,
} from "./tools/getTomorrowSchedule.js";

const pkSchedaSchema = z.string().min(1, "pkScheda is required");

function toStructuredText(title: string, data: Record<string, unknown>) {
  const text = JSON.stringify(data, null, 2);
  return `${title}\n${text}`;
}

function toolResult<T extends Record<string, unknown>>(title: string, structuredContent: T) {
  return {
    content: [
      {
        type: "text" as const,
        text: toStructuredText(title, structuredContent),
      },
    ],
    structuredContent,
  };
}

export function createServer() {
  const server = new McpServer({
    name: "argo-homework-mcp",
    version: "0.2.0",
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
    "get_homework_for_date",
    {
      description: "Get homework due on a specific date in YYYY-MM-DD format.",
      inputSchema: z.object({
        date: isoDateSchema,
      }),
      outputSchema: getTomorrowHomeworkOutputSchema,
    },
    async ({ date }) => {
      const dashboard = await refreshDashboard();
      const result = getHomeworkForDate(dashboard.registro, date);
      return toolResult(`Homework for ${date}`, result);
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

  server.registerTool(
    "get_schedule_for_date",
    {
      description: "Get school subjects for a specific date in YYYY-MM-DD format.",
      inputSchema: z.object({
        date: isoDateSchema,
      }),
      outputSchema: getTomorrowScheduleOutputSchema,
    },
    async ({ date }) => {
      const schedule = await getScheduleForDate(date);
      const result = extractScheduleForDate(schedule, date);
      return toolResult(`Schedule for ${date}`, result);
    },
  );

  server.registerTool(
    "get_profile_summary",
    {
      description: "Get current Argo profile summary from logged-in account.",
      inputSchema: z.object({}),
    },
    async () => {
      const profile = await getProfile();
      const result = {
        student: profile.alunno.nominativo,
        student_pk: profile.alunno.pk,
        class_pk: profile.scheda.classe.pk,
        class_name: profile.scheda.classe.desDenominazione,
        section: profile.scheda.classe.desSezione,
        school: profile.scheda.scuola.descrizione,
        course: profile.scheda.corso.descrizione,
        pk_scheda: profile.scheda.pk,
        guardian: profile.genitore.nominativo,
      };
      return toolResult("Profile summary", result);
    },
  );

  server.registerTool(
    "get_profile_details",
    {
      description: "Get detailed Argo profile details for student and guardian.",
      inputSchema: z.object({}),
    },
    async () => toolResult("Profile details", await getProfileDetails()),
  );

  server.registerTool(
    "get_notice_attachment_link",
    {
      description: "Get download link for a notice-board attachment by uid.",
      inputSchema: z.object({
        uid: z.string().min(1, "uid is required"),
      }),
    },
    async ({ uid }) => toolResult("Notice attachment link", { uid, url: await getNoticeAttachmentLink(uid) }),
  );

  server.registerTool(
    "get_student_attachment_link",
    {
      description: "Get download link for a student notice-board attachment.",
      inputSchema: z.object({
        uid: z.string().min(1, "uid is required"),
        pkScheda: pkSchedaSchema.optional(),
      }),
    },
    async ({ uid, pkScheda }) => {
      const resolvedPkScheda = pkScheda ?? await getDefaultPkScheda();
      const url = await getStudentAttachmentLink(uid, resolvedPkScheda);
      return toolResult("Student attachment link", { uid, pkScheda: resolvedPkScheda, url });
    },
  );

  server.registerTool(
    "get_payment_receipt",
    {
      description: "Get payment receipt link by IUV.",
      inputSchema: z.object({
        iuv: z.string().min(1, "iuv is required"),
      }),
    },
    async ({ iuv }) => toolResult("Payment receipt", await getPaymentReceipt(iuv)),
  );

  server.registerTool(
    "get_scrutiny_grades",
    {
      description: "Get scrutiny grades / period results if available.",
      inputSchema: z.object({}),
    },
    async () => {
      const items = (await getScrutinyGrades()) ?? [];
      return toolResult("Scrutiny grades", { items, count: items.length });
    },
  );

  server.registerTool(
    "get_meetings",
    {
      description: "Get teacher meeting availability and bookings.",
      inputSchema: z.object({}),
    },
    async () => toolResult("Meetings", await getMeetings()),
  );

  server.registerTool(
    "get_taxes",
    {
      description: "Get school taxes / payments.",
      inputSchema: z.object({
        pkScheda: pkSchedaSchema.optional(),
      }),
    },
    async ({ pkScheda }) => toolResult("Taxes", await getTaxes(pkScheda)),
  );

  server.registerTool(
    "get_pcto",
    {
      description: "Get PCTO data.",
      inputSchema: z.object({
        pkScheda: pkSchedaSchema.optional(),
      }),
    },
    async ({ pkScheda }) => toolResult("PCTO", { items: await getPcto(pkScheda) }),
  );

  server.registerTool(
    "get_recovery_courses",
    {
      description: "Get recovery courses data.",
      inputSchema: z.object({
        pkScheda: pkSchedaSchema.optional(),
      }),
    },
    async ({ pkScheda }) => toolResult("Recovery courses", await getRecoveryCourses(pkScheda)),
  );

  server.registerTool(
    "get_curriculum",
    {
      description: "Get student curriculum records.",
      inputSchema: z.object({
        pkScheda: pkSchedaSchema.optional(),
      }),
    },
    async ({ pkScheda }) => toolResult("Curriculum", { items: await getCurriculumData(pkScheda) }),
  );

  server.registerTool(
    "get_notice_board_history",
    {
      description: "Get notice-board history for a specific scheda.",
      inputSchema: z.object({
        pkScheda: pkSchedaSchema.optional(),
      }),
    },
    async ({ pkScheda }) => {
      const resolvedPkScheda = pkScheda ?? await getDefaultPkScheda();
      const items = await getNoticeBoardHistory(resolvedPkScheda);
      return toolResult("Notice board history", { pkScheda: resolvedPkScheda, items, count: items.length });
    },
  );

  server.registerTool(
    "get_student_notice_board_history",
    {
      description: "Get student notice-board history for a specific scheda.",
      inputSchema: z.object({
        pkScheda: pkSchedaSchema.optional(),
      }),
    },
    async ({ pkScheda }) => {
      const resolvedPkScheda = pkScheda ?? await getDefaultPkScheda();
      const items = await getStudentNoticeBoardHistory(resolvedPkScheda);
      return toolResult("Student notice board history", { pkScheda: resolvedPkScheda, items, count: items.length });
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

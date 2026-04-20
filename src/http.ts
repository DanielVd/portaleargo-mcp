import "dotenv/config";
import { createServer as createHttpServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";
import { ZodError } from "zod";
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
import { createServer } from "./index.js";
import { getHomeworkForDate, getTomorrowDateInRome, isoDateSchema } from "./tools/getTomorrowHomework.js";
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

  app.get("/api/profile/summary", async (_req, res) => {
    try {
      const profile = await getProfile();
      res.json({
        student: profile.alunno.nominativo,
        student_pk: profile.alunno.pk,
        class_pk: profile.scheda.classe.pk,
        class_name: profile.scheda.classe.desDenominazione,
        section: profile.scheda.classe.desSezione,
        school: profile.scheda.scuola.descrizione,
        course: profile.scheda.corso.descrizione,
        pk_scheda: profile.scheda.pk,
        guardian: profile.genitore.nominativo,
      });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/profile/details", async (_req, res) => {
    try {
      res.json(await getProfileDetails());
    } catch (error) {
      handleApiError(res, error);
    }
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
      const date = isoDateSchema.parse(req.params.date);
      const dashboard = await refreshDashboard();
      const result = getHomeworkForDate(dashboard.registro, date);
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

  app.get("/api/schedule/:date", async (req, res) => {
    try {
      const date = isoDateSchema.parse(req.params.date);
      const schedule = await getScheduleForDate(date);
      res.json(extractScheduleForDate(schedule, date));
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/meetings", async (_req, res) => {
    try {
      res.json(await getMeetings());
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/scrutiny-grades", async (_req, res) => {
    try {
      const items = (await getScrutinyGrades()) ?? [];
      res.json({ items, count: items.length });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/taxes", async (req, res) => {
    try {
      const pkScheda = getPkSchedaQuery(req);
      res.json(await getTaxes(pkScheda));
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/pcto", async (req, res) => {
    try {
      const pkScheda = getPkSchedaQuery(req);
      const items = await getPcto(pkScheda);
      res.json({ items, count: items.length });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/recovery-courses", async (req, res) => {
    try {
      const pkScheda = getPkSchedaQuery(req);
      res.json(await getRecoveryCourses(pkScheda));
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/curriculum", async (req, res) => {
    try {
      const pkScheda = getPkSchedaQuery(req);
      const items = await getCurriculumData(pkScheda);
      res.json({ items, count: items.length });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/notice-board/history", async (req, res) => {
    try {
      const pkScheda = getPkSchedaQuery(req) ?? await getDefaultPkScheda();
      const items = await getNoticeBoardHistory(pkScheda);
      res.json({ pkScheda, items, count: items.length });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/student-notice-board/history", async (req, res) => {
    try {
      const pkScheda = getPkSchedaQuery(req) ?? await getDefaultPkScheda();
      const items = await getStudentNoticeBoardHistory(pkScheda);
      res.json({ pkScheda, items, count: items.length });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/attachments/notice/:uid", async (req, res) => {
    try {
      res.json({ uid: req.params.uid, url: await getNoticeAttachmentLink(req.params.uid) });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/attachments/student/:uid", async (req, res) => {
    try {
      const pkScheda = getPkSchedaQuery(req) ?? await getDefaultPkScheda();
      res.json({
        uid: req.params.uid,
        pkScheda,
        url: await getStudentAttachmentLink(req.params.uid, pkScheda),
      });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get("/api/payment-receipt/:iuv", async (req, res) => {
    try {
      res.json(await getPaymentReceipt(req.params.iuv));
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

function getPkSchedaQuery(req: Request) {
  const value = req.query.pkScheda;
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  return value;
}

function handleApiError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request",
      message: error.issues[0]?.message ?? "Bad input",
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

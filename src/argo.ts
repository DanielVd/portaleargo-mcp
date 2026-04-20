import { Client, type Dashboard } from "portaleargo-api";
import { z } from "zod";

const envSchema = z.object({
  ARGO_SCHOOL_CODE: z.string().min(1, "ARGO_SCHOOL_CODE is required"),
  ARGO_USERNAME: z.string().min(1, "ARGO_USERNAME is required"),
  ARGO_PASSWORD: z.string().min(1, "ARGO_PASSWORD is required"),
});

let client: Client | null = null;
let initPromise: Promise<Client> | null = null;

export function readArgoEnv(env: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Missing or invalid Argo environment variables: ${message}`);
  }

  return parsed.data;
}

export async function initArgoClient(): Promise<Client> {
  if (client) {
    return client;
  }

  if (initPromise) {
    return initPromise;
  }

  const credentials = readArgoEnv();

  // Keep credentials only in server-side env variables.
  const nextClient = new Client({
    schoolCode: credentials.ARGO_SCHOOL_CODE,
    username: credentials.ARGO_USERNAME,
    password: credentials.ARGO_PASSWORD,
    dataProvider: null,
  });

  initPromise = (async () => {
    try {
      await nextClient.login();
      client = nextClient;
      return nextClient;
    } catch (error) {
      client = null;
      throw new Error(`Argo login failed: ${toSafeErrorMessage(error)}`);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export function getArgoClient(): Client {
  if (!client) {
    throw new Error("Argo client is not initialized");
  }

  return client;
}

export async function refreshDashboard(): Promise<Dashboard> {
  const argoClient = client ?? await initArgoClient();

  try {
    // Reusing login() lets the library refresh tokens and reload dashboard data.
    const loggedInClient = await argoClient.login();

    if (!loggedInClient.dashboard || !Array.isArray(loggedInClient.dashboard.registro)) {
      throw new Error("dashboard.registro is not available");
    }

    return loggedInClient.dashboard;
  } catch (error) {
    throw new Error(`Could not read Argo dashboard data: ${toSafeErrorMessage(error)}`);
  }
}

export async function getProfile() {
  const argoClient = client ?? await initArgoClient();
  const loggedInClient = await argoClient.login();

  if (!loggedInClient.profile) {
    throw new Error("Argo profile is not available");
  }

  return loggedInClient.profile;
}

export async function getProfileDetails() {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getDettagliProfilo();
}

export async function getScheduleForDate(date: string) {
  const argoClient = client ?? await initArgoClient();
  const [year, month, day] = date.split("-").map(Number);

  try {
    await argoClient.login();
    return await argoClient.getOrarioGiornaliero({ year, month, day });
  } catch (error) {
    throw new Error(`Could not read Argo schedule data: ${toSafeErrorMessage(error)}`);
  }
}

export async function getNoticeAttachmentLink(uid: string) {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getLinkAllegato(uid);
}

export async function getStudentAttachmentLink(uid: string, pkScheda?: string) {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getLinkAllegatoStudente(uid, pkScheda);
}

export async function getPaymentReceipt(iuv: string) {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getRicevuta(iuv);
}

export async function getScrutinyGrades() {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getVotiScrutinio();
}

export async function getMeetings() {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getRicevimenti();
}

export async function getTaxes(pkScheda?: string) {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getTasse(pkScheda);
}

export async function getPcto(pkScheda?: string) {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getPCTOData(pkScheda);
}

export async function getRecoveryCourses(pkScheda?: string) {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getCorsiRecupero(pkScheda);
}

export async function getCurriculumData(pkScheda?: string) {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getCurriculum(pkScheda);
}

export async function getNoticeBoardHistory(pkScheda: string) {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getStoricoBacheca(pkScheda);
}

export async function getStudentNoticeBoardHistory(pkScheda: string) {
  const argoClient = client ?? await initArgoClient();
  await argoClient.login();
  return argoClient.getStoricoBachecaAlunno(pkScheda);
}

export async function getDefaultPkScheda() {
  const profile = await getProfile();
  return profile.scheda.pk;
}

function toSafeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown error";
}

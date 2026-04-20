import { z } from "zod";
import type { Dashboard } from "portaleargo-api";

const ROME_TIME_ZONE = "Europe/Rome";

export const homeworkItemSchema = z.object({
  subject: z.string(),
  teacher: z.string(),
  assignment: z.string(),
  due_date: z.string(),
  hour: z.string(),
  activity: z.string(),
});

export const getTomorrowHomeworkOutputSchema = z.object({
  date: z.string(),
  items: z.array(homeworkItemSchema),
  count: z.number().int().nonnegative(),
});

export type HomeworkItem = z.infer<typeof homeworkItemSchema>;
export type TomorrowHomeworkResult = z.infer<typeof getTomorrowHomeworkOutputSchema>;
export type RegistroEntry = Dashboard["registro"][number];
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(timeZone: string) {
  let formatter = dateFormatterCache.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateFormatterCache.set(timeZone, formatter);
  }

  return formatter;
}

function formatDateInTimeZone(date: Date, timeZone: string): string {
  const parts = getDateFormatter(timeZone).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Could not format date for timezone ${timeZone}`);
  }

  return `${year}-${month}-${day}`;
}

function normalizeArgoDateToIsoDate(value: string): string {
  const trimmed = value.trim();

  // The library exposes Argo fields as strings such as "YYYY-MM-DD HH:mm:ss.SSS".
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);

  if (!Number.isNaN(parsed.getTime())) {
    return formatDateInTimeZone(parsed, ROME_TIME_ZONE);
  }

  throw new Error(`Unsupported Argo date format: ${value}`);
}

export function getTomorrowDateInRome(fromDate = new Date()): string {
  const todayInRome = formatDateInTimeZone(fromDate, ROME_TIME_ZONE);
  const [year, month, day] = todayInRome.split("-").map(Number);

  // Use noon UTC to avoid DST edge cases when moving one calendar day forward.
  const tomorrowAtNoonUtc = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0));
  return formatDateInTimeZone(tomorrowAtNoonUtc, ROME_TIME_ZONE);
}

export function getHomeworkForDate(
  registro: RegistroEntry[],
  targetDate: string,
): TomorrowHomeworkResult {
  return extractHomeworkDueOnDate(registro, isoDateSchema.parse(targetDate));
}

export function extractHomeworkDueOnDate(
  registro: RegistroEntry[],
  targetDate: string,
): TomorrowHomeworkResult {
  const items: HomeworkItem[] = [];

  for (const lesson of registro) {
    for (const homework of lesson.compiti ?? []) {
      const dueDate = normalizeArgoDateToIsoDate(homework.dataConsegna);

      if (dueDate !== targetDate) {
        continue;
      }

      items.push({
        subject: lesson.materia,
        teacher: lesson.docente,
        assignment: homework.compito,
        due_date: dueDate,
        hour: String(lesson.ora),
        activity: lesson.attivita ?? "",
      });
    }
  }

  return {
    date: targetDate,
    items,
    count: items.length,
  };
}

export function formatHomeworkSummary(result: TomorrowHomeworkResult): string {
  if (result.count === 0) {
    return `No homework due on ${result.date}.`;
  }

  const lines = result.items.map(
    (item) => `- ${item.subject}: ${item.assignment}`,
  );

  return [`Homework due on ${result.date}: ${result.count}`, ...lines].join("\n");
}

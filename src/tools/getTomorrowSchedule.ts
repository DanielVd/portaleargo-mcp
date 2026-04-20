import { z } from "zod";

export const scheduleItemSchema = z.object({
  subject: z.string(),
  teacher: z.string(),
  hour: z.string(),
  time: z.string(),
  class_name: z.string(),
  section: z.string(),
});

export const getTomorrowScheduleOutputSchema = z.object({
  date: z.string(),
  items: z.array(scheduleItemSchema),
  count: z.number().int().nonnegative(),
});

export type ScheduleItem = z.infer<typeof scheduleItemSchema>;
export type TomorrowScheduleResult = z.infer<typeof getTomorrowScheduleOutputSchema>;

export type OrarioItem = {
  numOra: number;
  docente: string;
  materia: string;
  desDenominazione: string;
  desSezione: string;
  ora: string | null;
};

export function extractScheduleForDate(
  schedule: OrarioItem[],
  targetDate: string,
): TomorrowScheduleResult {
  const items: ScheduleItem[] = schedule.map((lesson) => ({
    subject: lesson.materia,
    teacher: lesson.docente,
    hour: String(lesson.numOra),
    time: lesson.ora ?? "",
    class_name: lesson.desDenominazione,
    section: lesson.desSezione,
  }));

  return {
    date: targetDate,
    items,
    count: items.length,
  };
}

export function formatScheduleSummary(result: TomorrowScheduleResult): string {
  if (result.count === 0) {
    return `No schedule available for ${result.date}.`;
  }

  const lines = result.items.map(
    (item) => `- ${item.hour}. ${item.subject} (${item.teacher})`,
  );

  return [`Schedule for ${result.date}: ${result.count}`, ...lines].join("\n");
}

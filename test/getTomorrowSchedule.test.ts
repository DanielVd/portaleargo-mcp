import test from "node:test";
import assert from "node:assert/strict";
import { extractScheduleForDate, type OrarioItem } from "../src/tools/getTomorrowSchedule.js";

test("extractScheduleForDate maps schedule items", () => {
  const mockSchedule: OrarioItem[] = [
    {
      numOra: 1,
      docente: "Prof. Rossi",
      materia: "Matematica",
      desDenominazione: "3A",
      desSezione: "A",
      ora: "08:00",
    },
    {
      numOra: 2,
      docente: "Prof.ssa Bianchi",
      materia: "Italiano",
      desDenominazione: "3A",
      desSezione: "A",
      ora: null,
    },
  ];

  const result = extractScheduleForDate(mockSchedule, "2026-04-20");

  assert.deepEqual(result, {
    date: "2026-04-20",
    items: [
      {
        subject: "Matematica",
        teacher: "Prof. Rossi",
        hour: "1",
        time: "08:00",
        class_name: "3A",
        section: "A",
      },
      {
        subject: "Italiano",
        teacher: "Prof.ssa Bianchi",
        hour: "2",
        time: "",
        class_name: "3A",
        section: "A",
      },
    ],
    count: 2,
  });
});

import test from "node:test";
import assert from "node:assert/strict";
import { extractHomeworkDueOnDate, getHomeworkForDate } from "../src/tools/getTomorrowHomework.js";
import { mockRegistro } from "./fixtures/mockRegistro.js";

test("extractHomeworkDueOnDate keeps only homework due on the target date", () => {
  const result = extractHomeworkDueOnDate(mockRegistro, "2026-04-18");

  assert.equal(result.date, "2026-04-18");
  assert.equal(result.count, 2);
  assert.deepEqual(result.items, [
    {
      subject: "Italiano",
      teacher: "Prof.ssa Rossi",
      assignment: "Read chapter 5 and answer questions 1-4.",
      due_date: "2026-04-18",
      hour: "2",
      activity: "Antologia",
    },
    {
      subject: "Matematica",
      teacher: "Prof. Bianchi",
      assignment: "Solve exercises 12, 13, 14 on page 87.",
      due_date: "2026-04-18",
      hour: "4",
      activity: "",
    },
  ]);
});

test("getHomeworkForDate rejects invalid dates", () => {
  assert.throws(() => getHomeworkForDate(mockRegistro, "18-04-2026"), /YYYY-MM-DD/);
});

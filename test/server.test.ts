import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/index.js";

test("createServer registers get_tomorrow_homework", () => {
  const server = createServer() as unknown as {
    _registeredTools: Record<string, unknown>;
  };

  const toolNames = Object.keys(server._registeredTools).sort();

  assert.deepEqual(toolNames, [
    "get_curriculum",
    "get_homework_for_date",
    "get_meetings",
    "get_notice_attachment_link",
    "get_notice_board_history",
    "get_payment_receipt",
    "get_pcto",
    "get_profile_details",
    "get_profile_summary",
    "get_recovery_courses",
    "get_schedule_for_date",
    "get_scrutiny_grades",
    "get_student_attachment_link",
    "get_student_notice_board_history",
    "get_taxes",
    "get_tomorrow_homework",
    "get_tomorrow_schedule",
  ]);
});

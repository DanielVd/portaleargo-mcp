import test from "node:test";
import assert from "node:assert/strict";

// Node 18 lacks global File, but undici v7 expects it during import.
// The project runtime is Node >=20; this keeps local tests usable on older dev shells.
globalThis.File ??= class File {} as typeof File;

test("createServer registers expected tools", async () => {
  const { createServer } = await import("../src/index.js");
  const server = createServer() as unknown as {
    _registeredTools: Record<string, unknown>;
  };

  const toolNames = Object.keys(server._registeredTools).sort();

  assert.deepEqual(toolNames, [
    "confirm_student_notice_read",
    "get_bacheca",
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
    "get_student_documents_history",
    "get_student_notice_board_history",
    "get_taxes",
    "get_tomorrow_homework",
    "get_tomorrow_schedule",
  ]);
});

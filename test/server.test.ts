import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/index.js";

test("createServer registers get_tomorrow_homework", () => {
  const server = createServer() as unknown as {
    _registeredTools: Record<string, unknown>;
  };

  assert.equal("get_tomorrow_homework" in server._registeredTools, true);
  assert.equal("get_tomorrow_schedule" in server._registeredTools, true);
});

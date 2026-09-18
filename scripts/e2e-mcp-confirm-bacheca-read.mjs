import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from "@modelcontextprotocol/sdk/client/stdio.js";

const requiredEnv = [
  "ARGO_SCHOOL_CODE",
  "ARGO_USERNAME",
  "ARGO_PASSWORD",
];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const childEnv = {
  ...getDefaultEnvironment(),
  ARGO_SCHOOL_CODE: process.env.ARGO_SCHOOL_CODE,
  ARGO_USERNAME: process.env.ARGO_USERNAME,
  ARGO_PASSWORD: process.env.ARGO_PASSWORD,
};

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["dist/index.js"],
  env: childEnv,
});

const client = new Client({
  name: "argo-mutation-e2e",
  version: "1.0.0",
});

function textFromResult(result) {
  return Array.isArray(result?.content)
    ? result.content
        .filter((entry) => entry?.type === "text")
        .map((entry) => entry.text)
        .join("\n")
    : "";
}

function requireSuccessfulToolResult(name, result) {
  if (result?.isError === true) {
    throw new Error(`${name} failed: ${textFromResult(result) || "unknown MCP tool error"}`);
  }
  return result;
}

try {
  await client.connect(transport);

  const { tools } = await client.listTools();
  const toolNames = new Set(tools.map((tool) => tool.name));

  assert.ok(
    toolNames.has("get_bacheca"),
    "MCP server did not register get_bacheca",
  );
  assert.ok(
    toolNames.has("confirm_bacheca_notice_read"),
    "MCP server did not register confirm_bacheca_notice_read",
  );

  console.log("✅ MCP handshake completed");
  console.log("✅ Required tools registered");

  const beforeResult = requireSuccessfulToolResult(
    "get_bacheca before mutation",
    await client.callTool({
      name: "get_bacheca",
      arguments: {},
    }),
  );

  const before = beforeResult.structuredContent;
  assert.ok(before && typeof before === "object", "get_bacheca returned no structuredContent");
  assert.ok(Array.isArray(before.items), "get_bacheca returned no items array");
  assert.equal(typeof before.pkScheda, "string", "get_bacheca returned no pkScheda");

  const candidate = before.items.find(
    (item) =>
      item &&
      typeof item === "object" &&
      item.pvRichiesta === true &&
      item.isPresaVisione === true &&
      typeof item.pk === "string" &&
      Array.isArray(item.listaAllegati) &&
      item.listaAllegati.length > 0,
  );

  assert.ok(
    candidate,
    "No already-read bulletin with an attachment is available for the safe mutation probe",
  );

  console.log(
    `✅ Safe candidate selected: alreadyRead=true attachments=${candidate.listaAllegati.length}`,
  );

  const mutationResult = requireSuccessfulToolResult(
    "confirm_bacheca_notice_read",
    await client.callTool({
      name: "confirm_bacheca_notice_read",
      arguments: {
        prgMessaggio: candidate.pk,
        pkScheda: before.pkScheda,
      },
    }),
  );

  const mutation = mutationResult.structuredContent;
  assert.ok(
    mutation && typeof mutation === "object",
    "confirm_bacheca_notice_read returned no structuredContent",
  );
  assert.ok(
    mutation.success === true || mutation.data?.success === true,
    "Famiglia mutation response did not report success=true",
  );

  console.log("✅ MCP mutation tool returned success=true");

  const afterResult = requireSuccessfulToolResult(
    "get_bacheca after mutation",
    await client.callTool({
      name: "get_bacheca",
      arguments: {
        pkScheda: before.pkScheda,
      },
    }),
  );

  const after = afterResult.structuredContent;
  assert.ok(after && typeof after === "object", "Post-mutation get_bacheca returned no structuredContent");
  assert.ok(Array.isArray(after.items), "Post-mutation get_bacheca returned no items array");

  const afterItem = after.items.find(
    (item) => item && typeof item === "object" && item.pk === candidate.pk,
  );

  assert.ok(afterItem, "Mutated bulletin was not found after re-read");
  assert.equal(
    afterItem.isPresaVisione,
    true,
    "Bulletin is not marked as read after mutation",
  );

  console.log("✅ Post-mutation re-read confirmed isPresaVisione=true");
  console.log("✅ MCP Famiglia mutation E2E completed");
} finally {
  await client.close().catch(() => undefined);
}

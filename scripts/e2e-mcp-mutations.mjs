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
    throw new Error(
      `${name} failed: ${textFromResult(result) || "unknown MCP tool error"}`,
    );
  }
  return result;
}

async function callTool(name, args = {}) {
  return requireSuccessfulToolResult(
    name,
    await client.callTool({
      name,
      arguments: args,
    }),
  );
}

async function validateGenericBulletinRead() {
  const beforeResult = await callTool("get_bacheca");
  const before = beforeResult.structuredContent;

  assert.ok(
    before && typeof before === "object",
    "get_bacheca returned no structuredContent",
  );
  assert.ok(Array.isArray(before.items), "get_bacheca returned no items array");
  assert.equal(
    typeof before.pkScheda,
    "string",
    "get_bacheca returned no pkScheda",
  );

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
    `✅ Generic bulletin safe candidate selected: alreadyRead=true attachments=${candidate.listaAllegati.length}`,
  );

  const mutationResult = await callTool("confirm_bacheca_notice_read", {
    prgMessaggio: candidate.pk,
    pkScheda: before.pkScheda,
  });

  const mutation = mutationResult.structuredContent;
  assert.ok(
    mutation && typeof mutation === "object",
    "confirm_bacheca_notice_read returned no structuredContent",
  );
  assert.ok(
    mutation.success === true || mutation.data?.success === true,
    "Generic bulletin mutation response did not report success=true",
  );

  console.log("✅ Generic bulletin MCP mutation returned success=true");

  const afterResult = await callTool("get_bacheca", {
    pkScheda: before.pkScheda,
  });

  const after = afterResult.structuredContent;
  assert.ok(
    after && typeof after === "object",
    "Post-mutation get_bacheca returned no structuredContent",
  );
  assert.ok(
    Array.isArray(after.items),
    "Post-mutation get_bacheca returned no items array",
  );

  const afterItem = after.items.find(
    (item) => item && typeof item === "object" && item.pk === candidate.pk,
  );

  assert.ok(afterItem, "Mutated bulletin was not found after re-read");
  assert.equal(
    afterItem.isPresaVisione,
    true,
    "Bulletin is not marked as read after mutation",
  );

  console.log("✅ Generic bulletin re-read confirmed isPresaVisione=true");

  return before.pkScheda;
}

async function validateStudentDocumentRead(defaultPkScheda) {
  const curriculumResult = await callTool("get_curriculum");
  const curriculum = curriculumResult.structuredContent;

  assert.ok(
    curriculum && typeof curriculum === "object",
    "get_curriculum returned no structuredContent",
  );
  assert.ok(
    Array.isArray(curriculum.items),
    "get_curriculum returned no items array",
  );

  const schede = [
    defaultPkScheda,
    ...curriculum.items
      .map((item) =>
        item && typeof item === "object" && typeof item.pkScheda === "string"
          ? item.pkScheda
          : undefined,
      )
      .filter(Boolean),
  ].filter((value, index, values) => values.indexOf(value) === index);

  let candidate;

  for (const pkScheda of schede) {
    const historyResult = await callTool("get_student_documents_history", {
      pkScheda,
    });
    const history = historyResult.structuredContent;

    assert.ok(
      history && typeof history === "object",
      "get_student_documents_history returned no structuredContent",
    );
    assert.ok(
      Array.isArray(history.items),
      "get_student_documents_history returned no items array",
    );

    const item = history.items.find(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        entry.isPresaVisione === true &&
        typeof entry.pk === "string",
    );

    if (item) {
      candidate = {
        pkScheda,
        pk: item.pk,
      };
      break;
    }
  }

  assert.ok(
    candidate,
    "No already-read student document is available for the safe mutation probe",
  );

  console.log(
    "✅ Student document safe candidate selected: alreadyRead=true",
  );

  const mutationResult = await callTool("confirm_student_notice_read", {
    prgMessaggio: candidate.pk,
    pkScheda: candidate.pkScheda,
  });

  const mutation = mutationResult.structuredContent;
  assert.ok(
    mutation && typeof mutation === "object",
    "confirm_student_notice_read returned no structuredContent",
  );
  assert.equal(
    mutation.ok,
    true,
    "Student document MCP wrapper did not report ok=true",
  );
  assert.equal(
    mutation.response?.success,
    true,
    "Student document Famiglia mutation did not report success=true",
  );

  console.log("✅ Student document MCP mutation returned success=true");

  const afterResult = await callTool("get_student_documents_history", {
    pkScheda: candidate.pkScheda,
  });
  const after = afterResult.structuredContent;

  assert.ok(
    after && typeof after === "object",
    "Post-mutation student history returned no structuredContent",
  );
  assert.ok(
    Array.isArray(after.items),
    "Post-mutation student history returned no items array",
  );

  const afterItem = after.items.find(
    (item) => item && typeof item === "object" && item.pk === candidate.pk,
  );

  assert.ok(afterItem, "Mutated student document was not found after re-read");
  assert.equal(
    afterItem.isPresaVisione,
    true,
    "Student document is not marked as read after mutation",
  );

  console.log("✅ Student document re-read confirmed isPresaVisione=true");
}

try {
  await client.connect(transport);

  const { tools } = await client.listTools();
  const toolNames = new Set(tools.map((tool) => tool.name));

  for (const requiredTool of [
    "get_bacheca",
    "confirm_bacheca_notice_read",
    "get_curriculum",
    "get_student_documents_history",
    "confirm_student_notice_read",
  ]) {
    assert.ok(
      toolNames.has(requiredTool),
      `MCP server did not register ${requiredTool}`,
    );
  }

  console.log("✅ MCP handshake completed");
  console.log("✅ Required mutation E2E tools registered");

  const defaultPkScheda = await validateGenericBulletinRead();
  await validateStudentDocumentRead(defaultPkScheda);

  console.log("✅ MCP Famiglia mutation E2E completed");
} finally {
  await client.close().catch(() => undefined);
}

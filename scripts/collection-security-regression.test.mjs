import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";

const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));
const mcpRequire = createRequire(new URL("../packages/mcp/package.json", import.meta.url));
const consumers = [
  ["Astro", createRequire(webRequire.resolve("astro/package.json"))],
  ["MCP application", mcpRequire],
  ["MCP server", createRequire(mcpRequire.resolve("@modelcontextprotocol/server"))],
  ["MCP client", createRequire(mcpRequire.resolve("@modelcontextprotocol/client"))],
];
const serverRequire = consumers[2][1];
consumers.push(["MCP core", createRequire(serverRequire.resolve("@modelcontextprotocol/core"))]);

for (const [consumer, require] of consumers) {
  const { z } = await import(pathToFileURL(require.resolve("zod")).href);

  for (const kind of ["array", "set", "map"]) {
    test(`${consumer}: bounded Zod ${kind} rejects excess size before parsing elements`, () => {
      let calls = 0;
      const item = z.string().refine(() => { calls += 1; return true; });
      const make = (values) => kind === "array" ? values : kind === "set" ? new Set(values) : new Map(values.map((value, index) => [String(index), value]));
      const schema = kind === "array" ? z.array(item).max(2, "bounded") : kind === "set" ? z.set(item).max(2, "bounded") : z.map(z.string(), item).check(z.maxSize(2, "bounded"));
      const result = schema.safeParse(make(["a", "b", "c"]));
      assert.equal(result.success, false);
      assert.equal(result.error.issues[0].message, "bounded");
      assert.equal(calls, 0);
      const valid = make(["a", "b"]);
      assert.deepEqual(schema.parse(valid), valid);
      assert.equal(calls, 2);
    });
  }

  test(`${consumer}: Zod preserves preprocessing and async validation at the bound`, async () => {
    const schema = z.array(z.string()).overwrite((values) => values.slice(0, 2)).max(2);
    assert.deepEqual(schema.parse(["a", "b", "c"]), ["a", "b"]);
    const asyncSchema = z.array(z.string().refine(async (value) => value.length > 0)).max(2);
    assert.deepEqual(await asyncSchema.parseAsync(["a", "b"]), ["a", "b"]);
    assert.equal((await asyncSchema.safeParseAsync([""])).success, false);
  });
}

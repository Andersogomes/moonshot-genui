import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleData, scopeFor, ScreenAssembler, offlineBlocks, hasEnoughData, EMIT_BLOCK_TOOL } from "./index.ts";

for (const ctx of ["owner", "viewer", "leader"] as const) {
  test(`offline ${ctx} screen passes the grammar`, () => {
    const s = scopeFor(sampleData, ctx, "p-anderson");
    assert.ok(hasEnoughData(s));
    const a = new ScreenAssembler(s);
    for (const b of offlineBlocks(s)) {
      const v = a.accept(b);
      assert.ok(v.ok, `${b.type}: ${!v.ok && v.reason}`);
    }
    assert.equal(a.blocks[0]?.type, "gen/insight/narrative");
    assert.ok(a.blocks.length <= 6);
  });
}

test("viewer scope excludes private entries and feedback", () => {
  const s = scopeFor(sampleData, "viewer", "p-anderson");
  assert.ok(s.entries.every((e) => e.visibility === "public"));
  assert.ok(s.feedback.every((f) => f.visibility === "public"));
  assert.ok(!s.allowedSourceIds.has("f-5") && !s.allowedSourceIds.has("e-5"));
  assert.equal(s.locked.length, 1);
});

test("leader scope has no individual feedback and drops teams under 5", () => {
  const s = scopeFor(sampleData, "leader", "p-anderson");
  assert.equal(s.feedback.length, 0);
  assert.ok(s.teams.every((t) => t.headcount >= 5));
});

const narrative = (ids: string[]) => ({ type: "gen/insight/narrative", kicker: "k", headline: "A headline that is long enough.", confidence: "High", provenance: { summary: "From 2 entries", source_ids: ids } });

test("rejects a block citing a private source on a viewer screen", () => {
  const a = new ScreenAssembler(scopeFor(sampleData, "viewer", "p-anderson"));
  const v = a.accept(narrative(["f-5"]));
  assert.equal(v.ok, false);
});

test("rejects an edited quote", () => {
  const a = new ScreenAssembler(scopeFor(sampleData, "owner", "p-anderson"));
  const v = a.accept({ type: "gen/insight/evidence", quote: { text: "Anderson is a rockstar.", author: "Rafael", role: "PM", source_id: "f-1" }, why: "x", confidence: "High", provenance: { summary: "From 1 note", source_ids: ["f-1"] } });
  assert.equal(v.ok, false);
});

test("rejects blocks without provenance and a second narrative", () => {
  const a = new ScreenAssembler(scopeFor(sampleData, "owner", "p-anderson"));
  assert.equal(a.accept({ ...narrative(["e-1"]), provenance: undefined }).ok, false);
  assert.equal(a.accept(narrative(["e-1"])).ok, true);
  assert.equal(a.accept(narrative(["e-1"])).ok, false);
});

test("tool schema is a JSON object schema", () => {
  assert.equal(EMIT_BLOCK_TOOL.input_schema.type, "object");
  assert.ok(JSON.stringify(EMIT_BLOCK_TOOL.input_schema).includes("gen/insight/risk"));
});

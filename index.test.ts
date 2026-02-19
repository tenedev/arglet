import assert from "node:assert/strict";
import { it } from "node:test";
import arglet from "./index.ts";

it("returns identical config when no args provided", () => {
  const baseConfig = {
    port: "3000",
    debug: false,
    features: { enabled: true },
    tags: ["a"],
  };

  const result = arglet(baseConfig, []);
  assert.deepEqual(result, baseConfig);
});

it("parses --key=value format", () => {
  const result = arglet({ port: "3000" }, ["--port=8080"]);
  assert.equal(result.port, "8080");
});

it("parses --key value format", () => {
  const result = arglet({ port: "3000" }, ["--port", "9000"]);
  assert.equal(result.port, "9000");
});

it("boolean flag without value enables it", () => {
  const result = arglet({ debug: false }, ["--debug"]);
  assert.equal(result.debug, true);
});

it("--no-flag disables boolean flag", () => {
  const result = arglet({ debug: true }, ["--no-debug"]);
  assert.equal(result.debug, false);
});

it("throws when --no- used on non-boolean field", () => {
  assert.throws(() => {
    arglet({ port: "3000" }, ["--no-port"]);
  }, /only valid for boolean/i);
});

it("throws when missing value for non-boolean", () => {
  assert.throws(() => {
    arglet({ port: "3000" }, ["--port"]);
  }, /requires a value/i);
});

it("supports nested dot notation", () => {
  const result = arglet({ server: { port: "3000" } }, ["--server.port=8080"]);

  assert.equal(result.server.port, "8080");
});

it("parses arrays using default separator", () => {
  const result = arglet({ tags: [] as string[] }, ["--tags=a,b,c"]);

  assert.deepEqual(result.tags, ["a", "b", "c"]);
});

it("respects custom array separator", () => {
  const result = arglet({ tags: [] as string[] }, ["--tags=a|b|c"], {
    arraySeparator: "|",
  });

  assert.deepEqual(result.tags, ["a", "b", "c"]);
});

it("ignores unknown flags", () => {
  const result = arglet({ foo: "bar" }, ["--unknown=123"]);
  assert.deepEqual(result, { foo: "bar" });
});

it("uses process.argv when args not provided", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "script", "--port=7777"];

  const result = arglet({ port: "3000" });

  assert.equal(result.port, "7777");

  process.argv = originalArgv;
});

it("structuredClone prevents mutation", () => {
  const original = { port: "3000" };
  const result = arglet(original, ["--port=9999"]);

  assert.equal(original.port, "3000");
  assert.equal(result.port, "9999");
  assert.notStrictEqual(original, result);
});

it("debug option true triggers logger branch", () => {
  const result = arglet({ debug: false }, [], { debug: true });
  assert.deepEqual(result, { debug: false });
});

it("process.env.DEBUG enables debug branch", () => {
  const original = process.env.DEBUG;
  process.env.DEBUG = "1";

  const result = arglet({ foo: "bar" }, []);
  assert.deepEqual(result, { foo: "bar" });

  process.env.DEBUG = original;
});

it("covers undefined flagName branch", () => {
  const result = arglet({ a: "b" }, ["--"]);
  assert.deepEqual(result, { a: "b" });
});

it("covers options-only overload branch", () => {
  const result = arglet({ port: "3000" }, { debug: true, arraySeparator: "|" });

  assert.equal(result.port, "3000");
});

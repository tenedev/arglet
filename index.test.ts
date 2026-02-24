import { expect, it } from "vitest";
import arglet from "./index";

it("returns identical config when no args provided", () => {
  const baseConfig = {
    port: 3000,
    debug: false,
    features: { enabled: true },
    tags: ["a"],
  };

  const result = arglet(baseConfig, []);
  expect(result).toEqual(baseConfig);
});

it("structuredClone prevents mutation", () => {
  const original = { port: 3000 };
  const result = arglet(original, ["--port=9999"]);

  expect(original.port).toBe(3000);
  expect(result.port).toBe(9999);
  expect(result).not.toBe(original);
});

it("parses --key=value and casts to number", () => {
  const result = arglet({ port: 3000 }, ["--port=8080"]);
  expect(result.port).toBe(8080);
  expect(typeof result.port).toBe("number");
});

it("parses --key value format", () => {
  const result = arglet({ port: 3000 }, ["--port", "9000"]);
  expect(result.port).toBe(9000);
});

it("throws if invalid number provided", () => {
  expect(() => arglet({ port: 3000 }, ["--port=hello"])).toThrow(
    /expects a number/i,
  );
});

it("does NOT cast when schema is string", () => {
  const result = arglet({ port: "3000" }, ["--port=8080"]);
  expect(result.port).toBe("8080");
});

it("boolean flag enables", () => {
  const result = arglet({ debug: false }, ["--debug"]);
  expect(result.debug).toBe(true);
});

it("--no-flag disables", () => {
  const result = arglet({ debug: true }, ["--no-debug"]);
  expect(result.debug).toBe(false);
});

it("throws when --no- used on non-boolean", () => {
  expect(() => arglet({ port: 3000 }, ["--no-port"])).toThrow(
    /only valid for boolean/i,
  );
});

it("throws when missing value for non-boolean", () => {
  expect(() => arglet({ port: 3000 }, ["--port"])).toThrow(/requires a value/i);
});

it("parses string arrays", () => {
  const result = arglet({ tags: [] as string[] }, ["--tags=a,b,c"]);
  expect(result.tags).toEqual(["a", "b", "c"]);
});

it("respects custom array separator", () => {
  const result = arglet({ tags: [] as string[] }, ["--tags=a|b|c"], {
    arraySeparator: "|",
  });

  expect(result.tags).toEqual(["a", "b", "c"]);
});

it("parses number arrays correctly", () => {
  const result = arglet({ scores: [1] }, ["--scores=4,5,6"]);
  expect(result.scores).toEqual([4, 5, 6]);
});

it("throws on invalid numeric array values", () => {
  expect(() => arglet({ scores: [1] }, ["--scores=1,hello,3"])).toThrow(
    /expects numeric values/i,
  );
});

it("supports nested dot notation", () => {
  const result = arglet({ server: { port: 3000 } }, ["--server.port=8080"]);

  expect(result.server.port).toBe(8080);
});

it("ignores nested unknown path", () => {
  const result = arglet({ a: { b: 1 } }, ["--a.c=5"]);

  expect(result.a).toEqual({ b: 1 });
});

it("gracefully handles malformed dot path", () => {
  const result = arglet({ a: 1 }, ["--a..b=5"]);
  expect(result.a).toBe(1);
});

it("undefined schema type keeps raw string", () => {
  const result = arglet({ value: undefined }, ["--value=123"]);
  expect(result.value).toBe("123");
});

it("null schema type keeps raw string", () => {
  const result = arglet({ value: null }, ["--value=123"]);
  expect(result.value).toBe("123");
});

it("ignores unknown flags", () => {
  const result = arglet({ foo: "bar" }, ["--unknown=123"]);
  expect(result).toEqual({ foo: "bar" });
});

it("covers undefined flagName branch", () => {
  const result = arglet({ a: "b" }, ["--"]);
  expect(result).toEqual({ a: "b" });
});

it("ignores non-prefixed arguments", () => {
  const result = arglet({ foo: "bar" }, ["hello"]);
  expect(result).toEqual({ foo: "bar" });
});

it("ignores single dash flags", () => {
  const result = arglet({ foo: "bar" }, ["-f"]);
  expect(result).toEqual({ foo: "bar" });
});

it("last flag wins", () => {
  const result = arglet({ port: 3000 }, ["--port=8000", "--port=9000"]);
  expect(result.port).toBe(9000);
});

it("handles empty string value", () => {
  const result = arglet({ name: "" }, ["--name="]);
  expect(result.name).toBe("");
});

it("covers options-only overload", () => {
  const result = arglet({ port: 3000 }, { debug: true, arraySeparator: "|" });

  expect(result.port).toBe(3000);
});

it("debug option true branch", () => {
  const result = arglet({ debug: false }, [], { debug: true });
  expect(result).toEqual({ debug: false });
});

it("process.env.DEBUG enables debug", () => {
  const original = process.env.DEBUG;
  process.env.DEBUG = "1";

  const result = arglet({ foo: "bar" }, []);
  expect(result).toEqual({ foo: "bar" });

  process.env.DEBUG = original;
});

it("uses process.argv fallback", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "script", "--port=7777"];

  const result = arglet({ port: 3000 });
  expect(result.port).toBe(7777);

  process.argv = originalArgv;
});

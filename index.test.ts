import { expect, it } from "vitest";
import arglet from "./index";

it("returns identical config when no args provided", () => {
  const baseConfig = {
    port: "3000",
    debug: false,
    features: { enabled: true },
    tags: ["a"],
  };

  const result = arglet(baseConfig, []);
  expect(result).toEqual(baseConfig);
});

it("parses --key=value format", () => {
  const result = arglet({ port: "3000" }, ["--port=8080"]);
  expect(result.port).toBe("8080");
});

it("parses --key value format", () => {
  const result = arglet({ port: "3000" }, ["--port", "9000"]);
  expect(result.port).toBe("9000");
});

it("boolean flag without value enables it", () => {
  const result = arglet({ debug: false }, ["--debug"]);
  expect(result.debug).toBe(true);
});

it("--no-flag disables boolean flag", () => {
  const result = arglet({ debug: true }, ["--no-debug"]);
  expect(result.debug).toBe(false);
});

it("throws when --no- used on non-boolean field", () => {
  expect(() => {
    arglet({ port: "3000" }, ["--no-port"]);
  }).toThrow(/only valid for boolean/i);
});

it("throws when missing value for non-boolean", () => {
  expect(() => {
    arglet({ port: "3000" }, ["--port"]);
  }).toThrow(/requires a value/i);
});

it("supports nested dot notation", () => {
  const result = arglet({ server: { port: "3000" } }, ["--server.port=8080"]);

  expect(result.server.port).toBe("8080");
});

it("parses arrays using default separator", () => {
  const result = arglet({ tags: [] as string[] }, ["--tags=a,b,c"]);

  expect(result.tags).toEqual(["a", "b", "c"]);
});

it("respects custom array separator", () => {
  const result = arglet({ tags: [] as string[] }, ["--tags=a|b|c"], {
    arraySeparator: "|",
  });

  expect(result.tags).toEqual(["a", "b", "c"]);
});

it("ignores unknown flags", () => {
  const result = arglet({ foo: "bar" }, ["--unknown=123"]);
  expect(result).toEqual({ foo: "bar" });
});

it("uses process.argv when args not provided", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "script", "--port=7777"];

  const result = arglet({ port: "3000" });

  expect(result.port).toBe("7777");

  process.argv = originalArgv;
});

it("structuredClone prevents mutation", () => {
  const original = { port: "3000" };
  const result = arglet(original, ["--port=9999"]);

  expect(original.port).toBe("3000");
  expect(result.port).toBe("9999");
  expect(result).not.toBe(original);
});

it("debug option true triggers logger branch", () => {
  const result = arglet({ debug: false }, [], { debug: true });
  expect(result).toEqual({ debug: false });
});

it("process.env.DEBUG enables debug branch", () => {
  const original = process.env.DEBUG;
  process.env.DEBUG = "1";

  const result = arglet({ foo: "bar" }, []);
  expect(result).toEqual({ foo: "bar" });

  process.env.DEBUG = original;
});

it("covers undefined flagName branch", () => {
  const result = arglet({ a: "b" }, ["--"]);
  expect(result).toEqual({ a: "b" });
});

it("covers options-only overload branch", () => {
  const result = arglet({ port: "3000" }, { debug: true, arraySeparator: "|" });

  expect(result.port).toBe("3000");
});

<div align="center">

# Arglet

_A tiny helper that lets your CLI args lead_

</div>

[![ci](https://github.com/teneplaysofficial/arglet/actions/workflows/ci.yml/badge.svg)](https://github.com/teneplaysofficial/arglet)
[![codecov](https://codecov.io/gh/teneplaysofficial/arglet/graph/badge.svg?token=jPMx4VQVBo)](https://codecov.io/gh/teneplaysofficial/arglet)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/teneplaysofficial/arglet/main.svg)](https://results.pre-commit.ci/latest/github/teneplaysofficial/arglet/main)

## Overview

**Arglet** is a small, joyful utility for CLI tools that helps merge configuration from CLI arguments.

**Arglet is designed to be:**

- 🌱 lightweight and dependency-free
- 🧠 predictable and easy to reason about
- ✨ TypeScript-first with great IntelliSense
- 🔒 schema-driven and type-respecting
- 🔧 parser-agnostic

Arglet uses your configuration object as the source of truth.
Only keys defined in that object are allowed, and values are parsed according to their existing type.

## Installation

```bash
npm install arglet
# or
pnpm add arglet
# or
yarn add arglet
```

## Quick Start

Get a fully-typed CLI configuration in **one line**.

```ts
import arglet from "arglet";

const config = arglet({
  input: "src",
  output: "dist",
  watch: false,
});
```

```bash
node cli.js --input=lib --watch
```

Output:

```ts
{
  input: "lib",
  output: "dist",
  watch: true
}
```

## Usage

### Basic usage

Define a configuration object and let **Arglet** update it using CLI arguments.

```ts
import arglet from "arglet";

const config = arglet({
  name: "sriman",
  age: 23,
  debug: false,
});
```

Run your script:

```bash
node cli.js --name tene --age 25 --debug
```

Result:

```ts
{
  name: "tene",
  age: 25,
  debug: true
}
```

> Arglet respects the type defined in your config.
> Since `age` is a number in the schema, `"25"` is automatically cast to `25`.

### Type behavior (schema-driven parsing)

Arglet parses values strictly based on the type in your configuration object.

| Schema Type | CLI Input     | Result Type |
| ----------- | ------------- | ----------- |
| `boolean`   | `--flag`      | `true`      |
| `boolean`   | `--no-flag`   | `false`     |
| `number`    | `--port=8080` | `number`    |
| `string`    | `--port=8080` | `"8080"`    |
| `string[]`  | `--tags=a,b`  | `string[]`  |
| `number[]`  | `--ids=1,2,3` | `number[]`  |

If the type is `undefined` or `null`, Arglet preserves the raw string value.

### Boolean flags

Boolean options support implicit enable/disable flags.

```ts
const config = arglet({
  verbose: false,
  cache: true,
});
```

```bash
--verbose        # sets verbose → true
--no-cache       # sets cache → false
```

> ❗ Boolean shortcuts are only allowed for boolean options.
> Using `--flag` or `--no-flag` on non-boolean keys throws an error.

### Explicit values

Non-boolean options **must** receive a value.

```ts
const config = arglet({
  port: 3000,
});
```

```bash
--port 8080
# or
--port=8080
```

If a value cannot be parsed according to the schema type, Arglet throws an error.

Example:

```bash
--port hello
```

❌ Throws:

```
--port expects a number
```

### Array values

Provide multiple values using a separator (`,` by default).

```ts
const config = arglet({
  ids: [] as number[],
});
```

```bash
--ids=1,2,3
```

Result:

```ts
{
  ids: [1, 2, 3];
}
```

If your schema is:

```ts
const config = arglet({
  ids: [] as string[],
});
```

Then:

```bash
--ids=1,2,3
```

Result:

```ts
{
  ids: ["1", "2", "3"];
}
```

You can customize the separator:

```ts
arglet({ ids: [] }, { arraySeparator: "|" });
```

```bash
--ids=1|2|3
```

### Nested configuration (dot notation)

Arglet supports deep configuration using dot paths.

```ts
const config = arglet({
  server: {
    host: "localhost",
    port: 3000,
  },
});
```

```bash
--server.host=0.0.0.0 --server.port=8080
```

Arglet will update nested properties while preserving types.

Only existing paths are allowed — unknown nested keys are ignored.

### Unknown flags

Flags that do not exist in your configuration object are ignored.

```bash
--unknown
```

Ignored (unless debug mode is enabled).

### Custom arguments (testing & programmatic use)

You can pass arguments directly (useful for tests or programmatic usage).

```ts
const config = arglet({ debug: false }, ["--debug"]);
```

### Debug mode

Enable debug output to see how arguments are parsed and applied.

```ts
arglet({ debug: false }, { debug: true });
```

This logs:

- ignored flags
- boolean inference decisions
- final resolved configuration

### Error handling

Arglet is intentionally strict.

The following will throw errors:

```bash
--age            # age is not boolean
--no-name        # name is not boolean
--port hello     # port expects number
```

This keeps CLI behavior **predictable and safe**.

### Example CLI

```ts
import arglet from "arglet";

const config = arglet({
  input: "src",
  output: "dist",
  watch: false,
});

console.log(config);
```

```bash
node cli.js --input=lib --watch
```

## Philosophy

Arglet is not a full argument parser.
It assumes you already control argument shape.

Its job is simple:

- Treat your config as the schema
- Merge CLI flags safely
- Respect types
- Fail loudly when misused

Predictable input → predictable output.

# ADR 0008 — Pinning frontend toolchain versions

- **Status:** Accepted
- **Date:** 2026-08-03
- **Revisit when:** `eslint-config-next` moves to `typescript-eslint` v9

## Context

The project convention is to use the **latest stable release**. For the two packages
below, "latest" breaks either the build or the linter. Both were **actually installed and
then reverted** — this is not a guess from a changelog.

## Decision

| Package | Pinned to | `latest` | Why not latest |
|---|---|---|---|
| `typescript` | **6.0.3** | 7.0.2 | TS 7 breaks linting |
| `eslint` | **9.39.5** | 10.8.0 | Breaks `eslint-plugin-react` |

Everything else runs the newest stable release: Next 16.2.12, React 19.2.8,
Tailwind 4.3.3, Redux Toolkit 2.12, TanStack Query 5.101.4, NextAuth 4.24.15, axios 1.19.

### TypeScript 6.0.3

With default configuration, TS 7.0.2 **fails the build**:

```
TypeScript 7.0.2 does not provide the compiler API required by Next.js.
Enable experimental.useTypeScriptCli in your Next.js config to use the
TypeScript CLI, or install TypeScript 6 instead.
```

Turning on `experimental.useTypeScriptCli` makes the build **pass**, and type checking
still genuinely runs — verified by introducing a deliberate type error, which produced
`TS2322` and failed the build. But linting dies outright:

```
Error: typescript-eslint does not support TS 7.0.
```

`eslint-config-next@16.2.12` depends on `typescript-eslint@^8.46.0`, which does not support
TS 7. Losing the linter means losing `make check` and the CI gate — not a worthwhile trade.

TS 6.0.3 is the highest stable release Next 16 accepts through the compiler API. (npm's
`beta` dist-tag points at the older `6.0.0-beta`; 6.0.2 and 6.0.3 are proper releases.)

### ESLint 9.39.5

ESLint 10.8.0 crashes while loading the config:

```
TypeError: Error while loading rule 'react/display-name':
contextOrFilename.getFilename is not a function
```

`eslint-plugin-react`, a dependency of `eslint-config-next`, still calls
`context.getFilename()`, an API ESLint 10 removed.

## Consequences

✅ `yarn build` and `yarn lint` are both green and CI can run
❌ One step behind the latest release, so both versions must be pinned **exactly**
(`"typescript": "6.0.3"`, `"eslint": "9.39.5"`, no caret) — otherwise `yarn up` will
quietly pull in a broken version

## What to do when revisiting

1. `npm view eslint-config-next dependencies` — wait for `typescript-eslint` at `^9`
2. Try TS 7 and ESLint 10 again, then run `yarn build && yarn lint`
3. If it works, update this ADR rather than deleting it — add a "Superseded" note

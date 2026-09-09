# @stencil/cli

The command-line entry point for Stencil. Thin by design - loads `@stencil/core/compiler` at runtime.

## Overview

- Parses CLI flags and dispatches to a task
- Loads the compiler dynamically (`load-compiler.ts`) so the CLI itself stays small
- Owns config discovery/merging, telemetry, migrations, and the `stencil init`/`stencil generate` wizard

## Key Files

| File                    | Purpose                                                       |
| ------------------------ | -------------------------------------------------------------- |
| `run.ts`                | Entry point - parses flags, loads config, dispatches to a task |
| `parse-flags.ts`        | CLI flag parsing                                                |
| `config-flags.ts`       | Flag → config mapping, `BOOLEAN_CLI_FLAGS`                     |
| `merge-flags.ts`        | Merges CLI flags into loaded config                             |
| `find-config.ts`        | Locates `stencil.config.ts`                                     |
| `load-compiler.ts`      | Dynamically loads `@stencil/core/compiler`                      |
| `check-version.ts`      | npm version check / update notice                                |
| `task-*.ts`             | One file per task (`build`, `serve`, `watch`, `generate`, `init`, `migrate`, `docs`, `prerender`, `add`, `info`, `help`, `telemetry`) |

## Directory Structure

| Directory     | Purpose                                                            |
| -------------- | ------------------------------------------------------------------- |
| `wizard/`     | `stencil init` / `stencil generate` interactive prompts (clack-based) |
| `migrations/` | `stencil migrate` codemod rules - one file per breaking change      |
| `telemetry/`  | Anonymous usage telemetry                                           |

## Wizard

`stencil init` scaffolds new projects or adds capabilities to existing ones. Third-party packages participate by exporting a `wizard` object from a `stencil.wizard` field in `package.json` - see `wizard/types.ts` for the `WizardInitContribution` / `WizardGenerateContribution` shapes. `wizard/discover.ts` finds contributions, `wizard/init/` runs them.

## Migrations

Each file in `migrations/rules/` is a codemod for one major → major breaking change (e.g. `output-target-renames.ts`, `encapsulation-api.ts`, `form-associated.ts`). `stencil migrate` runs them against a project's `stencil.config.ts` and source.

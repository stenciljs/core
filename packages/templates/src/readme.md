# @stencil/templates

File/boilerplate templates shared by `stencil init` (project scaffolding) and `stencil generate` (component/style generation). Pure string generation - no filesystem or prompt logic, so it's consumable by both the CLI wizard and, in principle, other tooling.

## Directory Structure

| Directory   | Purpose                                                          |
| ------------ | ------------------------------------------------------------------ |
| `project/`  | New-project scaffolding: `stencil.config.ts` content, `package.json` fields, `index.html`, template path resolution |
| `generate/` | `stencil generate` boilerplate: component class, stylesheet, usage preview HTML |

## Key Files

| File                    | Purpose                                                    |
| ------------------------ | ------------------------------------------------------------- |
| `project/paths.ts`      | `PROJECT_TEMPLATES` registry + `getTemplatePath` - maps a template id to its files under `templates/project/` |
| `project/config.ts`     | Generates `stencil.config.ts` source + `package.json` fields from wizard selections |
| `project/index-html.ts` | Generates the starter `index.html`                          |
| `generate/component.ts` | Component class boilerplate (`getComponentBoilerplate`, `toPascalCase`) |
| `generate/style.ts`     | Stylesheet boilerplate per `StyleExtension` (css/scss/etc)   |
| `generate/preview.ts`   | Usage example + preview HTML snippets                        |

The actual template source files live under `templates/project/` (not `src/`) and are copied/interpolated by the functions above.

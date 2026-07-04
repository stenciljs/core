import type { ConfigCompat, OutputTarget } from '@stencil/core/compiler';

/**
 * Stable, plugin-relevant subset of the compiler's resolved project config.
 * Fields are fully resolved - paths are absolute, defaults are applied.
 * Prefer this over reading `stencil.config.ts` directly.
 */
export interface ProjectConfig {
  /** Absolute path to the project root. */
  rootDir: string;
  /** Absolute path to the source directory (default: `<rootDir>/src`). */
  srcDir: string;
  /** Component namespace, e.g. `"MyLib"`. Used in generated code and registry names. */
  namespace: string;
  /** Filesystem-safe namespace: `namespace.toLowerCase()` unless overridden. Used in output file/directory names. */
  fsNamespace: string;
  /** Fully resolved output targets with all defaults applied. */
  outputTargets: ReadonlyArray<OutputTarget>;
  /** Absolute path to the global script, if configured. */
  globalScript?: string;
  /** Absolute path to the global stylesheet, if configured. */
  globalStyle?: string;
  /** Backwards-compatibility flags (`compat` in stencil.config.ts). */
  compat?: ConfigCompat;
  /** Enable signal-based reactivity backing (top-level in stencil.config.ts). */
  signalBacking?: boolean;
}

/**
 * Structured editor for `stencil.config.ts`, backed by the TypeScript compiler API.
 * Obtain one via {@link WizardContext.openStencilConfig}.
 *
 * All mutation methods accumulate edits in memory. Call {@link save} once to
 * write them all back to disk in a single pass.
 *
 * @example
 * const editor = await ctx.openStencilConfig();
 * editor.addImport('@stencil/vue-output-target', ['vueOutputTarget']);
 * editor.addOutputTarget("vueOutputTarget({ proxiesFile: '../vue-lib/src/components.ts' })");
 * await editor.save();
 */
export interface StencilConfigEditor {
  /**
   * Returns `true` if any import from `moduleSpecifier` already exists in the file.
   *
   * @example
   * if (!editor.hasImport('@stencil/vue-output-target')) {
   *   editor.addImport('@stencil/vue-output-target', ['vueOutputTarget']);
   * }
   */
  hasImport(moduleSpecifier: string): boolean;

  /**
   * Adds `import { ...namedImports } from 'moduleSpecifier'` after the last
   * existing import in the file. No-op if any import from `moduleSpecifier`
   * already exists.
   *
   * @param moduleSpecifier - The module to import from, e.g. `'@stencil/sass'`.
   * @param namedImports - At least one named export to import.
   *
   * @example
   * editor.addImport('@stencil/vue-output-target', ['vueOutputTarget']);
   * // > import { vueOutputTarget } from '@stencil/vue-output-target';
   *
   * @example
   * editor.addImport('@stencil/sass', ['sass']);
   * // > import { sass } from '@stencil/sass';
   */
  addImport(moduleSpecifier: string, namedImports: [string, ...string[]]): void;

  /**
   * Returns `true` if `substring` appears anywhere in the text of the
   * `outputTargets` array. Use this to guard against adding the same target twice.
   *
   * @example
   * if (!editor.outputTargetsContains('vueOutputTarget(')) {
   *   editor.addOutputTarget("vueOutputTarget({ proxiesFile: '../vue-lib/src/components.ts' })");
   * }
   */
  outputTargetsContains(substring: string): boolean;

  /**
   * Appends `expression` as a new element in the `outputTargets` array,
   * creating the `outputTargets` property if it is absent from the config.
   *
   * `expression` is a TypeScript expression that is inserted verbatim into
   * the source file. It must evaluate to a value assignable to {@link OutputTarget}
   * - built-in targets use object literal syntax (e.g. `"{ type: 'standalone' }"`),
   * while third-party targets are function calls that return `OutputTargetCustom`
   * (e.g. `"vueOutputTarget({...})"`). Call {@link addImport} first to bring the
   * factory function into scope.
   *
   * @param expression - A TypeScript expression, e.g. `"{ type: 'standalone' }"`
   *   or `"vueOutputTarget({ proxiesFile: '../vue-lib/src/components.ts' })"`.
   *
   * @example
   * // Built-in target (object literal):
   * editor.addOutputTarget("{ type: 'standalone' }");
   *
   * @example
   * // Third-party target (OutputTargetCustom - add the import first):
   * editor.addImport('@stencil/vue-output-target', ['vueOutputTarget']);
   * editor.addOutputTarget("vueOutputTarget({ proxiesFile: '../vue-lib/src/components.ts' })");
   */
  addOutputTarget(expression: string): void;

  /**
   * Replaces the first element in the `outputTargets` array whose text contains
   * `substring` with `expression` in-place. Returns `true` if a match was found
   * and replaced, `false` if no element contained `substring`.
   *
   * Useful for the reconfigure flow — the replaced target stays at the same
   * position in the array rather than being moved to the end.
   *
   * @example
   * // Replace if already configured, otherwise append:
   * if (!editor.replaceOutputTarget('vueOutputTarget(', newExpression)) {
   *   editor.addOutputTarget(newExpression);
   * }
   */
  replaceOutputTarget(substring: string, expression: string): boolean;

  /**
   * Removes the first element in the `outputTargets` array whose text contains
   * `substring`. Returns `true` if an element was removed, `false` if no match
   * was found.
   *
   * @example
   * editor.removeOutputTarget('vueOutputTarget(');
   */
  removeOutputTarget(substring: string): boolean;

  /**
   * Returns `true` if `substring` appears anywhere in the text of the
   * `plugins` array. Use this to guard against adding the same plugin twice.
   *
   * @example
   * if (!editor.pluginsContains('sass(')) {
   *   editor.addPlugin('sass()');
   * }
   */
  pluginsContains(substring: string): boolean;

  /**
   * Appends `expression` as a new element in the `plugins` array,
   * creating the `plugins` property if it is absent from the config.
   *
   * `expression` is a TypeScript expression that is inserted verbatim into
   * the source file. Call {@link addImport} first to bring the plugin factory
   * into scope.
   *
   * @param expression - A TypeScript expression, e.g. `'sass()'` or
   *   `"sass({ injectGlobalPaths: ['src/global/variables.scss'] })"`.
   *
   * @example
   * editor.addImport('@stencil/sass', ['sass']);
   * editor.addPlugin('sass()');
   *
   * @example
   * editor.addImport('@stencil/sass', ['sass']);
   * editor.addPlugin("sass({ injectGlobalPaths: ['src/global/variables.scss'] })");
   */
  addPlugin(expression: string): void;

  /**
   * Replaces the first element in the `plugins` array whose text contains
   * `substring` with `expression` in-place. Returns `true` if a match was found
   * and replaced, `false` if no element contained `substring`.
   *
   * @example
   * if (!editor.replacePlugin('sass(', newSassCall)) {
   *   editor.addPlugin(newSassCall);
   * }
   */
  replacePlugin(substring: string, expression: string): boolean;

  /**
   * Removes the first element in the `plugins` array whose text contains
   * `substring`. Returns `true` if an element was removed, `false` if no match
   * was found.
   *
   * @example
   * editor.removePlugin('sass(');
   */
  removePlugin(substring: string): boolean;

  /** Write all accumulated edits back to disk. */
  save(): Promise<void>;
}

/**
 * Context passed to wizard steps at runtime.
 */
export interface WizardContext {
  /** True when `stencil.config.ts` did not previously exist (fresh scaffold). */
  isNewProject: boolean;
  /** Clack prompts - use instead of importing `@clack/prompts` directly for consistent UX. */
  prompts: typeof import('@clack/prompts');
  /** nypm - use instead of importing `nypm` directly so the package manager is auto-detected. */
  nypm: typeof import('nypm');
  /** Resolved project config. See {@link ProjectConfig} for available fields. */
  config: ProjectConfig;
  /**
   * Absolute path to the monorepo workspace root when the project is part of a
   * workspace, `undefined` for single-package projects.
   *
   * When present, `config.rootDir` is the core Stencil package (e.g.
   * `<workspaceRoot>/packages/core/`). The plugin is responsible for deciding
   * where in the workspace it wants to live and for creating that directory.
   */
  workspaceRoot?: string;
  /**
   * Open the project's `stencil.config.ts` for structured editing.
   * Use the returned {@link StencilConfigEditor} to add imports, output targets,
   * and plugins, then call `save()` to persist.
   *
   * Use {@link ts} directly when you need to manipulate other files or perform
   * operations the editor does not cover.
   */
  openStencilConfig: () => Promise<StencilConfigEditor>;
  /**
   * TypeScript compiler API. Available for advanced AST manipulation beyond
   * what {@link openStencilConfig} covers.
   */
  ts: typeof import('typescript');
}

/**
 * A single file a plugin can offer during `stencil generate`.
 */
export interface WizardFileTemplate {
  /** Label shown in the generate prompt checkbox, e.g. `"Spec Test (.spec.tsx)"`. */
  label: string;
  /**
   * File extension used to derive the filename and deduplicate contributions,
   * e.g. `"spec.tsx"` or `"e2e.ts"`.
   */
  extension: string;
  /**
   * Subdirectory within the component directory where the file is placed.
   * e.g. `'test'` to place alongside other test files. Omit for the component root.
   */
  subdirectory?: string;
  /**
   * Returns the file content. `className` is the PascalCase form of `tagName`.
   */
  template: (tagName: string, className: string) => string;
  /** Pre-selected in the generate prompt. Defaults to `true`. */
  selectedByDefault?: boolean;
}

/**
 * Context passed to dynamic `fileTemplates` resolvers during `stencil generate`.
 */
export interface GenerateContext {
  /** The dash-case component tag name entered by the user. */
  tagName: string;
  /** Resolved project config. See {@link ProjectConfig} for available fields. */
  config: ProjectConfig;
  /** Clack prompts - use instead of importing `@clack/prompts` directly for consistent UX. */
  prompts: typeof import('@clack/prompts');
  /** nypm - use instead of importing `nypm` directly so the package manager is auto-detected. */
  nypm: typeof import('nypm');
}

/**
 * Contribution a package can make to `stencil generate`.
 */
export interface WizardGenerateContribution {
  /**
   * Files this plugin can generate alongside the component.
   *
   * May be a static array or an async function that receives project context
   * (e.g. to read `vitest.config.ts` and offer one template per configured
   * Vitest project). Called after the user enters the component tag name.
   */
  fileTemplates?:
    | ReadonlyArray<WizardFileTemplate>
    | ((
        ctx: GenerateContext,
      ) => ReadonlyArray<WizardFileTemplate> | Promise<ReadonlyArray<WizardFileTemplate>>);

  /**
   * Additional style extensions this package supports (e.g. `['sass', 'scss']`
   * from `@stencil/sass`). The first entry is used as the default.
   */
  styleExtensions?: ReadonlyArray<string>;
}

/**
 * Contribution a package can make to `stencil init`.
 *
 * The plugin owns its entire setup: prompts, peer dep installs, config file
 * generation, example files, package.json script updates, etc.
 */
export interface WizardInitContribution {
  /** Stable identifier used to deduplicate across re-runs. */
  id: string;
  /** Human-readable name shown in the prompt list. */
  displayName: string;
  /** One-line description shown alongside the name. */
  description: string;
  /**
   * Called by the CLI after packages are installed. The plugin is responsible
   * for all further setup: additional prompts, peer dep installs, config file
   * writes, example tests, `.gitignore` and `package.json` script updates, etc.
   */
  run: (context: WizardContext) => Promise<void>;
}

/**
 * Interface a package exports to participate in `stencil init` and/or
 * `stencil generate`.
 *
 * Declare the entry point in `package.json`:
 * ```json
 * { "stencil": { "wizard": "./dist/wizard.js" } }
 * ```
 *
 * Export a named `wizard` constant from that module:
 * ```ts
 * export const wizard: StencilWizardPlugin = { ... };
 * ```
 */
export interface StencilWizardPlugin {
  /** Contributions to `stencil generate`. */
  generate?: WizardGenerateContribution;
  /** Contributions to `stencil init`. */
  init?: WizardInitContribution;
}

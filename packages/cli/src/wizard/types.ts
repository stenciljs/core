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

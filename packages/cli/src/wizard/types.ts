/**
 * Context passed to wizard steps at runtime.
 */
export interface WizardContext {
  /** Absolute path to the project root directory. */
  rootDir: string;
  /** True when a stencil.config.ts already exists (add-capabilities mode). */
  isExistingProject: boolean;
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
 * Contribution a package can make to `stencil generate`.
 */
export interface WizardGenerateContribution {
  /**
   * Files this plugin can generate alongside the component.
   * Each entry appears as a checkbox in the generate prompt.
   * A single plugin may contribute multiple entries (e.g. a vitest setup
   * with several project configs, each producing a differently-scoped test file).
   */
  fileTemplates?: ReadonlyArray<WizardFileTemplate>;

  /**
   * Additional style extensions this package supports (e.g. `['sass', 'scss']`
   * from `@stencil/sass`). The first entry is used as the default.
   */
  styleExtensions?: ReadonlyArray<string>;
}

/**
 * Contribution a package can make to `stencil init`.
 */
export interface WizardInitContribution {
  /** Stable identifier used to deduplicate across re-runs. */
  id: string;
  /** Human-readable name shown in the prompt list. */
  displayName: string;
  /** One-line description shown alongside the name. */
  description: string;
  /** npm packages to add to `devDependencies`. */
  devDependencies?: ReadonlyArray<string>;
  /** npm packages to add to `dependencies`. */
  dependencies?: ReadonlyArray<string>;
  /**
   * Additions to the generated / existing `stencil.config.ts`.
   * Only `imports` is supported initially; more fields will be added as needed.
   */
  configPatch?: {
    /** ES module import statements to prepend to the config file. */
    imports?: ReadonlyArray<string>;
  };
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

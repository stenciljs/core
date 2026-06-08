import * as p from '@clack/prompts';
import type { DocKey, OutputKey } from '@stencil/templates';

import { cancelIfAborted } from '../clack.js';
import type { DiscoveredPlugin } from '../discover.js';

export type { OutputKey, DocKey };

export interface KnownIntegration {
  package: string;
  displayName: string;
  description: string;
  group: string;
}

/** Well-known integrations the CLI can offer before any packages are installed. */
export const KNOWN_INTEGRATIONS: KnownIntegration[] = [
  // Testing
  {
    package: '@stencil/vitest',
    displayName: 'Vitest',
    description: 'Unit / Spec / Integration / Browser testing',
    group: 'Testing',
  },
  {
    package: '@stencil/playwright',
    displayName: 'Playwright',
    description: 'E2E testing',
    group: 'Testing',
  },

  // Styling
  {
    package: '@stencil/sass',
    displayName: 'Sass',
    description: 'Sass/SCSS styles',
    group: 'Styling',
  },

  // Linting
  {
    package: '@stencil/eslint-plugin',
    displayName: 'ESLint Plugin',
    description: 'Stencil-aware lint rules (ESLint, oxlint, Biome)',
    group: 'Linting',
  },

  // Tooling
  {
    package: '@stencil/storybook-plugin',
    displayName: 'Storybook',
    description: 'Component development & documentation',
    group: 'Tooling',
  },

  // Framework integrations
  {
    package: '@stencil/types-output-target',
    displayName: 'Types',
    description: 'TypeScript types for React, Vue, Solid, Svelte, Preact',
    group: 'Framework integrations',
  },
  {
    package: '@stencil/react-output-target',
    displayName: 'React',
    description: 'React component wrappers',
    group: 'Framework integrations',
  },
  {
    package: '@stencil/angular-output-target',
    displayName: 'Angular',
    description: 'Angular component wrappers',
    group: 'Framework integrations',
  },
  {
    package: '@stencil/vue-output-target',
    displayName: 'Vue',
    description: 'Vue component wrappers',
    group: 'Framework integrations',
  },
];

export async function promptOutputs(): Promise<OutputKey[]> {
  const picks = await p.multiselect<OutputKey>({
    message: 'Outputs:',
    options: [
      { value: 'loader', label: 'Loader', hint: 'performant lazy-loader; browser & bundler ready' },
      {
        value: 'standalone',
        label: 'Standalone',
        hint: 'per-component modules, import only what you need',
      },
      { value: 'ssr', label: 'SSR', hint: 'pre-render components in any JS server environment' },
      {
        value: 'ssr-wasm',
        label: 'SSR WASM',
        hint: 'experimental: compile SSR to a portable WASM binary',
      },
      { value: 'www', label: 'WWW', hint: 'app mode with dev server and optional PWA support' },
    ],
    required: false,
  });
  cancelIfAborted(picks);
  return picks as OutputKey[];
}

export interface FeatureSelections {
  signals: boolean;
  globalStyle: boolean;
  globalScript: boolean;
}

export async function promptFeatures(): Promise<FeatureSelections> {
  const picks = await p.multiselect<string>({
    message: 'Features:',
    options: [
      {
        value: 'signals',
        label: 'Signals',
        hint: 'signal-backed @Prop/@State for cross-framework reactive interop',
      },
      {
        value: 'globalStyle',
        label: 'Global style',
        hint: 'src/global.css with @import "stencil-globals" / "stencil-hydrate"',
      },
      {
        value: 'globalScript',
        label: 'Global script',
        hint: 'src/global.ts — runs before any component loads',
      },
    ],
    required: false,
  });
  cancelIfAborted(picks);
  const set = new Set(picks as string[]);
  return {
    signals: set.has('signals'),
    globalStyle: set.has('globalStyle'),
    globalScript: set.has('globalScript'),
  };
}

export async function promptDocs(): Promise<DocKey[]> {
  const picks = await p.multiselect<DocKey>({
    message: 'Docs:',
    options: [
      {
        value: 'cem',
        label: 'CEM',
        hint: 'custom-elements.json — powers VS Code, Storybook, framework wrappers',
      },
      { value: 'json', label: 'JSON', hint: 'docs/api.json — machine-readable component API' },
      {
        value: 'vscode',
        label: 'VS Code',
        hint: 'vscode-data.json — editor autocomplete for your components',
      },
    ],
    initialValues: ['cem'],
    required: false,
  });
  cancelIfAborted(picks);
  return picks as DocKey[];
}

export async function promptProjectName(): Promise<string> {
  const name = await p.text({
    message: 'Project name:',
    defaultValue: 'my-stencil-library',
    validate: (v) => {
      if (!v?.trim()) return 'Project name is required';
    },
  });
  cancelIfAborted(name);
  return name as string;
}

function buildGroupedOptions(integrations: KnownIntegration[]): Record<string, p.Option<string>[]> {
  const groups: Record<string, p.Option<string>[]> = {};
  for (const i of integrations) {
    (groups[i.group] ??= []).push({ value: i.package, label: i.displayName, hint: i.description });
  }
  return groups;
}

export async function promptIntegrations(): Promise<KnownIntegration[]> {
  const picks = await p.groupMultiselect<string>({
    message: 'Add integrations (optional):',
    options: buildGroupedOptions(KNOWN_INTEGRATIONS),
    required: false,
  });
  cancelIfAborted(picks);
  return KNOWN_INTEGRATIONS.filter((i) => (picks as string[]).includes(i.package));
}

export interface AddCapabilitiesSelection {
  toInstall: KnownIntegration[];
  toConfigure: DiscoveredPlugin[];
}

/**
 * Prompt for actions on an existing project: install new integrations and/or
 * run init wizards for already-installed packages with wizard contributions.
 *
 * @param installable - KNOWN_INTEGRATIONS not yet present in the project.
 * @param configurable - Already-installed plugins that declare an `init` contribution.
 * @returns Selected integrations to install and plugins to configure.
 */
export async function promptAddCapabilities(
  installable: KnownIntegration[],
  configurable: DiscoveredPlugin[],
): Promise<AddCapabilitiesSelection> {
  const options: Record<string, p.Option<string>[]> = {};

  if (installable.length > 0) {
    options['Install new integrations'] = installable.map((i) => ({
      value: `install:${i.package}`,
      label: i.displayName,
      hint: i.description,
    }));
  }

  if (configurable.length > 0) {
    options['Configure existing integrations'] = configurable.map((d) => ({
      value: `configure:${d.packageName}`,
      label: d.plugin.init!.displayName,
      hint: d.plugin.init!.description,
    }));
  }

  const picks = await p.groupMultiselect<string>({
    message: 'What would you like to do?',
    options,
    required: false,
  });
  cancelIfAborted(picks);

  const pickedSet = new Set(picks as string[]);
  return {
    toInstall: installable.filter((i) => pickedSet.has(`install:${i.package}`)),
    toConfigure: configurable.filter((d) => pickedSet.has(`configure:${d.packageName}`)),
  };
}

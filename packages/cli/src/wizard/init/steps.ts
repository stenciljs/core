import * as p from '@clack/prompts';

import { cancelIfAborted } from '../clack.js';

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

export async function promptIntegrations(): Promise<KnownIntegration[]> {
  // Build group map preserving declaration order
  const groups: Record<string, p.Option<string>[]> = {};
  for (const i of KNOWN_INTEGRATIONS) {
    (groups[i.group] ??= []).push({ value: i.package, label: i.displayName, hint: i.description });
  }

  const picks = await p.groupMultiselect<string>({
    message: 'Add integrations (optional):',
    options: groups,
    required: false,
  });
  cancelIfAborted(picks);
  return KNOWN_INTEGRATIONS.filter((i) => (picks as string[]).includes(i.package));
}

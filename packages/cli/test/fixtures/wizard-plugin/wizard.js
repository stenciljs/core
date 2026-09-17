import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const wizard = {
  init: {
    id: 'fixture-wizard-plugin',
    displayName: 'Fixture Plugin',
    description: 'E2E test fixture with wizard contributions',
    async run({ config: { rootDir } }) {
      const configPath = join(rootDir, 'stencil.config.ts');
      const existing = await readFile(configPath, 'utf8');
      await writeFile(
        configPath,
        `import { fixturePlugin } from 'fixture-wizard-plugin';\n` + existing,
        'utf8',
      );
    },
  },
  generate: {
    styleExtensions: ['fixture'],
    fileTemplates: [
      {
        label: 'Fixture Test (.fixture.ts)',
        extension: 'fixture.ts',
        selectedByDefault: true,
        template: (tagName, className) =>
          `// fixture test for <${tagName}>\nexport class ${className}Fixture {}\n`,
      },
    ],
  },
};

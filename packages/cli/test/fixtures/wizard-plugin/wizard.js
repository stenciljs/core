export const wizard = {
  init: {
    id: 'fixture-wizard-plugin',
    displayName: 'Fixture Plugin',
    description: 'E2E test fixture with wizard contributions',
    configPatch: {
      imports: ["import { fixturePlugin } from 'fixture-wizard-plugin';"],
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

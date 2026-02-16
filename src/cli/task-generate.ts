import { normalizePath, validateComponentTag } from '@utils';
import { join, parse, relative } from 'path';

import type { ValidatedConfig } from '../declarations';

/**
 * Task to generate component boilerplate and write it to disk. This task can
 * cause the program to exit with an error under various circumstances, such as
 * being called in an inappropriate place, being asked to overwrite files that
 * already exist, etc.
 *
 * @param config the user-supplied config, which we need here to access `.sys`.
 * @returns a void promise
 */
export const taskGenerate = async (config: ValidatedConfig): Promise<void> => {
  if (!config.configPath) {
    config.logger.error('Please run this command in your root directory (i. e. the one containing stencil.config.ts).');
    return config.sys.exit(1);
  }

  const absoluteSrcDir = config.srcDir;

  if (!absoluteSrcDir) {
    config.logger.error(`Stencil's srcDir was not specified.`);
    return config.sys.exit(1);
  }

  const { prompt } = await import('prompts');

  const input =
    config.flags.unknownArgs.find((arg) => !arg.startsWith('-')) ||
    ((await prompt({ name: 'tagName', type: 'text', message: 'Component tag name (dash-case):' })).tagName as string);

  if (undefined === input) {
    // in some shells (e.g. Windows PowerShell), hitting Ctrl+C results in a TypeError printed to the console.
    // explicitly return here to avoid printing the error message.
    return;
  }
  const { dir, base: componentName } = parse(input);

  const tagError = validateComponentTag(componentName);
  if (tagError) {
    config.logger.error(tagError);
    return config.sys.exit(1);
  }

  let cssExtension: GeneratableStylingExtension = 'css';
  if (!!config.plugins.find((plugin) => plugin.name === 'sass')) {
    cssExtension = await chooseSassExtension();
  } else if (!!config.plugins.find((plugin) => plugin.name === 'less')) {
    cssExtension = 'less';
  }
  const filesToGenerateExt = await chooseFilesToGenerate(cssExtension);
  if (!filesToGenerateExt) {
    // in some shells (e.g. Windows PowerShell), hitting Ctrl+C results in a TypeError printed to the console.
    // explicitly return here to avoid printing the error message.
    return;
  }
  const extensionsToGenerate: GeneratableExtension[] = ['tsx', ...filesToGenerateExt];
  const testFolder = extensionsToGenerate.some(isTest) ? 'test' : '';

  const outDir = join(absoluteSrcDir, 'components', dir, componentName);
  await config.sys.createDir(normalizePath(join(outDir, testFolder)), { recursive: true });

  const filesToGenerate: readonly BoilerplateFile[] = extensionsToGenerate.map((extension) => ({
    extension,
    path: getFilepathForFile(outDir, componentName, extension),
  }));
  await checkForOverwrite(filesToGenerate, config);

  const writtenFiles = await Promise.all(
    filesToGenerate.map((file) =>
      getBoilerplateAndWriteFile(
        config,
        componentName,
        extensionsToGenerate.includes('css') ||
          extensionsToGenerate.includes('sass') ||
          extensionsToGenerate.includes('scss') ||
          extensionsToGenerate.includes('less'),
        file,
        cssExtension,
      ),
    ),
  ).catch((error) => config.logger.error(error));

  if (!writtenFiles) {
    return config.sys.exit(1);
  }

  // We use `console.log` here rather than our `config.logger` because we don't want
  // our TUI messages to be prefixed with timestamps and so on.
  //
  // See STENCIL-424 for details.
  console.log();
  console.log(`${config.logger.gray('$')} stencil generate ${input}`);
  console.log();
  console.log(config.logger.bold('The following files have been generated:'));

  const absoluteRootDir = config.rootDir;
  writtenFiles.map((file) => console.log(`  - ${relative(absoluteRootDir, file)}`));
};

/**
 * Show a checkbox prompt to select the files to be generated.
 *
 * @param cssExtension the extension of the CSS file to be generated
 * @returns a read-only array of `GeneratableExtension`, the extensions that the user has decided
 * to generate
 */
const chooseFilesToGenerate = async (cssExtension: string): Promise<ReadonlyArray<GeneratableExtension>> => {
  const { prompt } = await import('prompts');
  return (
    await prompt({
      name: 'filesToGenerate',
      type: 'multiselect',
      message: 'Which additional files do you want to generate?',
      choices: [
        { value: cssExtension, title: `Stylesheet (.${cssExtension})`, selected: true },
        { value: 'spec.tsx', title: 'Spec Test  (.spec.tsx)', selected: true },
        { value: 'e2e.ts', title: 'E2E Test (.e2e.ts)', selected: true },
      ],
    })
  ).filesToGenerate;
};

const chooseSassExtension = async () => {
  const { prompt } = await import('prompts');
  return (
    await prompt({
      name: 'sassFormat',
      type: 'select',
      message:
        'Which Sass format would you like to use? (More info: https://sass-lang.com/documentation/syntax/#the-indented-syntax)',
      choices: [
        { value: 'sass', title: `*.sass Format`, selected: true },
        { value: 'scss', title: '*.scss Format' },
      ],
    })
  ).sassFormat;
};

/**
 * Get a filepath for a file we want to generate!
 *
 * The filepath for a given file depends on the path, the user-supplied
 * component name, the extension, and whether we're inside of a test directory.
 *
 * @param filePath      path to where we're going to generate the component
 * @param componentName the user-supplied name for the generated component
 * @param extension     the file extension
 * @returns the full filepath to the component (with a possible `test` directory
 * added)
 */
const getFilepathForFile = (filePath: string, componentName: string, extension: GeneratableExtension): string =>
  isTest(extension)
    ? normalizePath(join(filePath, 'test', `${componentName}.${extension}`))
    : normalizePath(join(filePath, `${componentName}.${extension}`));

/**
 * Get the boilerplate for a file and write it to disk
 *
 * @param config        the current config, needed for file operations
 * @param componentName the component name (user-supplied)
 * @param withCss       are we generating CSS?
 * @param file          the file we want to write
 * @param styleExtension extension used for styles
 * @returns a `Promise<string>` which holds the full filepath we've written to,
 * used to print out a little summary of our activity to the user.
 */
const getBoilerplateAndWriteFile = async (
  config: ValidatedConfig,
  componentName: string,
  withCss: boolean,
  file: BoilerplateFile,
  styleExtension: GeneratableStylingExtension,
): Promise<string> => {
  const boilerplate = getBoilerplateByExtension(componentName, file.extension, withCss, styleExtension);
  await config.sys.writeFile(normalizePath(file.path), boilerplate);
  return file.path;
};

/**
 * Check to see if any of the files we plan to write already exist and would
 * therefore be overwritten if we proceed, because we'd like to not overwrite
 * people's code!
 *
 * This function will check all the filepaths and if it finds any files log an
 * error and exit with an error code. If it doesn't find anything it will just
 * peacefully return `Promise<void>`.
 *
 * @param files  the files we want to check
 * @param config the Config object, used here to get access to `sys.readFile`
 */
const checkForOverwrite = async (files: readonly BoilerplateFile[], config: ValidatedConfig): Promise<void> => {
  const alreadyPresent: string[] = [];

  await Promise.all(
    files.map(async ({ path }) => {
      if ((await config.sys.readFile(path)) !== undefined) {
        alreadyPresent.push(path);
      }
    }),
  );

  if (alreadyPresent.length > 0) {
    config.logger.error(
      'Generating code would overwrite the following files:',
      ...alreadyPresent.map((path) => '\t' + normalizePath(path)),
    );
    await config.sys.exit(1);
  }
};

/**
 * Check if an extension is for a test
 *
 * @param extension the extension we want to check
 * @returns a boolean indicating whether or not its a test
 */
const isTest = (extension: GeneratableExtension): boolean => {
  return extension === 'e2e.ts' || extension === 'spec.tsx';
};

/**
 * Get the boilerplate for a file by its extension.
 *
 * @param tagName the name of the component we're generating
 * @param extension the file extension we want boilerplate for (.css, tsx, etc)
 * @param withCss a boolean indicating whether we're generating a CSS file
 * @param styleExtension extension used for styles
 * @returns a string container the file boilerplate for the supplied extension
 */
export const getBoilerplateByExtension = (
  tagName: string,
  extension: GeneratableExtension,
  withCss: boolean,
  styleExtension: GeneratableStylingExtension,
): string => {
  switch (extension) {
    case 'tsx':
      return getComponentBoilerplate(tagName, withCss, styleExtension);

    case 'css':
    case 'less':
    case 'sass':
    case 'scss':
      return getStyleUrlBoilerplate(styleExtension);

    case 'spec.tsx':
      return getSpecTestBoilerplate(tagName);

    case 'e2e.ts':
      return getE2eTestBoilerplate(tagName);

    default:
      throw new Error(`Unkown extension "${extension}".`);
  }
};

/**
 * Get the boilerplate for a file containing the definition of a component
 * @param tagName the name of the tag to give the component
 * @param hasStyle designates if the component has an external stylesheet or not
 * @param styleExtension extension used for styles
 * @returns the contents of a file that defines a component
 */
const getComponentBoilerplate = (
  tagName: string,
  hasStyle: boolean,
  styleExtension: GeneratableStylingExtension,
): string => {
  const decorator = [`{`];
  decorator.push(`  tag: '${tagName}',`);
  if (hasStyle) {
    decorator.push(`  styleUrl: '${tagName}.${styleExtension}',`);
  }
  decorator.push(`  shadow: true,`);
  decorator.push(`}`);

  return `import { Component, Host, h } from '@stencil/core';

@Component(${decorator.join('\n')})
export class ${toPascalCase(tagName)} {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
`;
};

/**
 * Get the boilerplate for style for a generated component
 * @param ext extension used for styles
 * @returns a boilerplate CSS block
 */
const getStyleUrlBoilerplate = (ext: GeneratableExtension): string =>
  ext === 'sass'
    ? `:host
  display: block
`
    : `:host {
  display: block;
}
`;

/**
 * Get the boilerplate for a file containing a spec (unit) test for a component
 * @param tagName the name of the tag associated with the component under test
 * @returns the contents of a file that unit tests a component
 */
const getSpecTestBoilerplate = (tagName: string): string =>
  `import { newSpecPage } from '@stencil/core/testing';
import { ${toPascalCase(tagName)} } from '../${tagName}';

describe('${tagName}', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [${toPascalCase(tagName)}],
      html: \`<${tagName}></${tagName}>\`,
    });
    expect(page.root).toEqualHtml(\`
      <${tagName}>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </${tagName}>
    \`);
  });
});
`;

/**
 * Get the boilerplate for a file containing an end-to-end (E2E) test for a component
 * @param tagName the name of the tag associated with the component under test
 * @returns the contents of a file that E2E tests a component
 */
const getE2eTestBoilerplate = (tagName: string): string =>
  `import { newE2EPage } from '@stencil/core/testing';

describe('${tagName}', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<${tagName}></${tagName}>');

    const element = await page.find('${tagName}');
    expect(element).toHaveClass('hydrated');
  });
});
`;

/**
 * Convert a dash case string to pascal case.
 * @param str the string to convert
 * @returns the converted input as pascal case
 */
const toPascalCase = (str: string): string =>
  str.split('-').reduce((res, part) => res + part[0].toUpperCase() + part.slice(1), '');

/**
 * Extensions available to generate.
 */
export type GeneratableExtension = 'tsx' | 'spec.tsx' | 'e2e.ts' | GeneratableStylingExtension;

/**
 * Extensions available to generate.
 */
export type GeneratableStylingExtension = 'css' | 'sass' | 'scss' | 'less';

/**
 * A little interface to wrap up the info we need to pass around for generating
 * and writing boilerplate.
 */
export interface BoilerplateFile {
  extension: GeneratableExtension;
  /**
   * The full path to the file we want to generate.
   */
  path: string;
}

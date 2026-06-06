import { join, parse, relative } from 'node:path';
import * as p from '@clack/prompts';
import { normalizePath, validateComponentTag } from '@stencil/core/compiler/utils';
import { getComponentBoilerplate, getStyleBoilerplate, toPascalCase } from '@stencil/templates';
import type { ValidatedConfig } from '@stencil/core/compiler';

import { cancelIfAborted } from './wizard/clack.js';
import { discoverPlugins } from './wizard/discover.js';
import type { ConfigFlags } from './config-flags.js';

interface FileToWrite {
  absPath: string;
  content: string;
}

export const taskGenerate = async (config: ValidatedConfig, flags: ConfigFlags): Promise<void> => {
  if (!config.configPath) {
    config.logger.error(
      'Please run this command in your root directory (i. e. the one containing stencil.config.ts).',
    );
    return config.sys.exit(1);
  }

  const srcDir = config.srcDir;
  if (!srcDir) {
    config.logger.error(`Stencil's srcDir was not specified.`);
    return config.sys.exit(1);
  }

  const discovered = await discoverPlugins(config.rootDir);
  const generateContribs = discovered.flatMap((d) =>
    d.plugin.generate ? [d.plugin.generate] : [],
  );

  p.intro('stencil generate');

  // tag name - from CLI arg or prompt
  const rawInput = flags.unknownArgs.find((arg) => !arg.startsWith('-'));
  let input: string;

  if (rawInput) {
    input = rawInput;
  } else {
    const tagName = await p.text({
      message: 'Component tag name (dash-case):',
      validate: (value) => validateComponentTag(value ?? ''),
    });
    cancelIfAborted(tagName);
    input = tagName;
  }

  const { dir, base: componentName } = parse(input);

  const tagError = validateComponentTag(componentName);
  if (tagError) {
    config.logger.error(tagError);
    return config.sys.exit(1);
  }

  // style format: CSS always available; plugins can contribute additional extensions
  const pluginStyleExts = [...new Set(generateContribs.flatMap((c) => c.styleExtensions ?? []))];
  const styleOptions = [
    { value: 'css', label: 'CSS (.css)' },
    ...pluginStyleExts.map((ext) => ({ value: ext, label: `${ext.toUpperCase()} (.${ext})` })),
    { value: '', label: 'None' },
  ];

  const stylePick = await p.select<string>({
    message: 'Stylesheet format:',
    options: styleOptions,
  });
  cancelIfAborted(stylePick);
  const styleExtension = stylePick || undefined; // empty string → no stylesheet

  // plugin file templates - only prompt if any are available
  const allFileTemplates = generateContribs.flatMap((c) => c.fileTemplates ?? []);
  let pickedExtensions: string[] = [];

  if (allFileTemplates.length > 0) {
    const filePick = await p.multiselect<string>({
      message: 'Additional files:',
      options: allFileTemplates.map((ft) => ({ value: ft.extension, label: ft.label })),
      initialValues: allFileTemplates
        .filter((ft) => ft.selectedByDefault !== false)
        .map((ft) => ft.extension),
      required: false,
    });
    cancelIfAborted(filePick);
    pickedExtensions = filePick;
  }

  // build the full list of files to write
  const outDir = join(srcDir, 'components', dir, componentName);
  const className = toPascalCase(componentName);

  const filesToWrite: FileToWrite[] = [];

  filesToWrite.push({
    absPath: normalizePath(join(outDir, `${componentName}.tsx`)),
    content: getComponentBoilerplate(componentName, styleExtension),
  });

  if (styleExtension) {
    filesToWrite.push({
      absPath: normalizePath(join(outDir, `${componentName}.${styleExtension}`)),
      content: getStyleBoilerplate(styleExtension),
    });
  }

  for (const ext of pickedExtensions) {
    const tmpl = allFileTemplates.find((ft) => ft.extension === ext)!;
    const absPath = normalizePath(join(outDir, tmpl.subdirectory ?? '', `${componentName}.${ext}`));
    filesToWrite.push({ absPath, content: tmpl.template(componentName, className) });
  }

  // overwrite check
  const wouldOverwrite = (
    await Promise.all(
      filesToWrite.map(async ({ absPath }) =>
        (await config.sys.readFile(absPath)) !== undefined ? absPath : null,
      ),
    )
  ).filter((f): f is string => f !== null);

  if (wouldOverwrite.length > 0) {
    config.logger.error(
      'Generating code would overwrite the following files:',
      ...wouldOverwrite.map((path) => '\t' + normalizePath(path)),
    );
    await config.sys.exit(1);
    return;
  }

  // create directories, then write
  const dirs = [...new Set(filesToWrite.map(({ absPath }) => normalizePath(join(absPath, '..'))))];
  await Promise.all(dirs.map((d) => config.sys.createDir(d, { recursive: true })));
  await Promise.all(
    filesToWrite.map(({ absPath, content }) => config.sys.writeFile(absPath, content)),
  );

  p.note(
    filesToWrite.map(({ absPath }) => relative(config.rootDir, absPath)).join('\n'),
    'Generated',
  );
  p.outro(`stencil generate ${input}`);
};

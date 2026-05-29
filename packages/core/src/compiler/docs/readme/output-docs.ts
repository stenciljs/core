import type * as d from '@stencil/core';

import { join, normalizePath, relative } from '../../../utils';
import { AUTO_GENERATE_COMMENT } from '../constants';
import { getUserReadmeContent } from '../generate-doc-data';
import { stylesToMarkdown } from './markdown-css-props';
import { customStatesToMarkdown } from './markdown-custom-states';
import { depsToMarkdown } from './markdown-dependencies';
import { eventsToMarkdown } from './markdown-events';
import { methodsToMarkdown } from './markdown-methods';
import { overviewToMarkdown } from './markdown-overview';
import { partsToMarkdown } from './markdown-parts';
import { propsToMarkdown } from './markdown-props';
import { slotsToMarkdown } from './markdown-slots';
import { usageToMarkdown } from './markdown-usage';

/**
 * Generate a README for a given component and write it to disk.
 *
 * Typically the README is going to be a 'sibling' to the component's source
 * code (i.e. written to the same directory) but the user may also configure a
 * custom output directory by setting {@link d.OutputTargetDocsReadme.dir}.
 *
 * Output readme files also include {@link AUTO_GENERATE_COMMENT}, and any
 * text located _above_ that comment is preserved when the new readme is written
 * to disk.
 *
 * @param config a validated Stencil config
 * @param compilerCtx the current compiler context
 * @param readmeOutputs docs-readme output targets
 * @param docsData documentation data for the component of interest
 * @param cmps metadata for all the components in the project
 */
export const generateReadme = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  readmeOutputs: d.OutputTargetDocsReadme[],
  docsData: d.JsonDocsComponent,
  cmps: d.JsonDocsComponent[],
) => {
  const isUpdate = !!docsData.readme;
  const userContent = isUpdate ? docsData.readme : getDefaultReadme(docsData);

  await Promise.all(
    readmeOutputs.map(async (readmeOutput) => {
      if (readmeOutput.dir) {
        const relativeReadmePath = relative(config.srcDir, docsData.readmePath);
        const readmeOutputPath = join(readmeOutput.dir, relativeReadmePath);

        const currentReadmeContent = await resolveUserContent(
          compilerCtx,
          readmeOutput,
          readmeOutputPath,
          config,
          userContent,
        );

        // CSS Custom Properties preservation is now handled centrally in outputDocs
        const readmeContent = generateMarkdown(
          currentReadmeContent,
          docsData,
          cmps,
          readmeOutput,
          config,
        );

        const existingContent = await compilerCtx.fs.readFile(readmeOutputPath);
        if (existingContent?.replace(/\r/g, '') === readmeContent.replace(/\r/g, '')) {
          return;
        }

        await compilerCtx.fs.writeFile(readmeOutputPath, readmeContent);
        if (isUpdate) {
          config.logger.info(`updated readme docs: ${docsData.tag}`);
        } else {
          config.logger.info(`created readme docs: ${docsData.tag}`);
        }
      }
    }),
  );
};

/**
 * Generate a single README for multiple components that share a directory and
 * therefore share a single readme.md file.
 *
 * Each component gets an '## `tag`' section; existing section headings are
 * shifted from h2 to h3 so they nest correctly under that heading.
 *
 * @param config a validated Stencil config
 * @param compilerCtx the current compiler context
 * @param readmeOutputs docs-readme output targets
 * @param cmps the components to include in the README (typically components that share a directory)
 * @param allCmps metadata for all the components in the project, used to generate dependency lists
 */
export const generateMergedReadme = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  readmeOutputs: d.OutputTargetDocsReadme[],
  cmps: d.JsonDocsComponent[],
  allCmps: d.JsonDocsComponent[],
) => {
  const primaryCmp = cmps[0];
  const isUpdate = !!primaryCmp.readme;
  const userContent = isUpdate ? primaryCmp.readme : getDefaultReadme(primaryCmp);

  await Promise.all(
    readmeOutputs.map(async (readmeOutput) => {
      if (readmeOutput.dir) {
        const relativeReadmePath = relative(config.srcDir, primaryCmp.readmePath);
        const readmeOutputPath = join(readmeOutput.dir, relativeReadmePath);

        const currentReadmeContent = await resolveUserContent(
          compilerCtx,
          readmeOutput,
          readmeOutputPath,
          config,
          userContent,
        );

        const readmeContent = generateMergedMarkdown(
          currentReadmeContent,
          cmps,
          allCmps,
          readmeOutput,
          config,
        );

        const existingContent = await compilerCtx.fs.readFile(readmeOutputPath);
        if (existingContent?.replace(/\r/g, '') === readmeContent.replace(/\r/g, '')) {
          return;
        }

        await compilerCtx.fs.writeFile(readmeOutputPath, readmeContent);
        const tags = cmps.map((c) => c.tag).join(', ');
        if (isUpdate) {
          config.logger.info(`updated readme docs: ${tags}`);
        } else {
          config.logger.info(`created readme docs: ${tags}`);
        }
      }
    }),
  );
};

export const generateMarkdown = (
  userContent: string | undefined,
  cmp: d.JsonDocsComponent,
  cmps: d.JsonDocsComponent[],
  readmeOutput: d.OutputTargetDocsReadme,
  config?: d.ValidatedConfig,
) => {
  return [
    userContent || '',
    AUTO_GENERATE_COMMENT,
    '',
    '',
    ...generateComponentBody(cmp, cmps, readmeOutput, config),
    `----------------------------------------------`,
    '',
    readmeOutput.footer,
    '',
  ].join('\n');
};

export const generateMergedMarkdown = (
  userContent: string | undefined,
  cmps: d.JsonDocsComponent[],
  allCmps: d.JsonDocsComponent[],
  readmeOutput: d.OutputTargetDocsReadme,
  config?: d.ValidatedConfig,
): string => {
  const sections: string[] = [];

  for (const cmp of cmps) {
    const body = generateComponentBody(cmp, allCmps, readmeOutput, config);
    if (body.length === 0) continue;
    // Shift h2 section headings to h3 so they nest under the component's h2
    const shiftedBody = body.map((line) => line.replace(/^## /, '### '));
    sections.push(`## \`${cmp.tag}\``, '', ...shiftedBody, '');
  }

  return [
    userContent || '',
    AUTO_GENERATE_COMMENT,
    '',
    '',
    ...sections,
    `----------------------------------------------`,
    '',
    readmeOutput.footer,
    '',
  ].join('\n');
};

/**
 * Returns the auto-generated lines for a single component (no header/footer).
 * @param cmp the component documentation data
 * @param cmps all components documentation data
 * @param readmeOutput the readme output target config
 * @param config the Stencil config
 * @returns an array of strings representing the auto-generated lines for the component
 */
const generateComponentBody = (
  cmp: d.JsonDocsComponent,
  cmps: d.JsonDocsComponent[],
  readmeOutput: d.OutputTargetDocsReadme,
  config?: d.ValidatedConfig,
): string[] => {
  const dependencies = readmeOutput.dependencies !== false ? depsToMarkdown(cmp, cmps, config) : [];
  return [
    ...getDocsDeprecation(cmp),
    ...overviewToMarkdown(cmp.overview),
    ...usageToMarkdown(cmp.usage),
    ...propsToMarkdown(cmp.props),
    ...eventsToMarkdown(cmp.events),
    ...methodsToMarkdown(cmp.methods),
    ...slotsToMarkdown(cmp.slots),
    ...partsToMarkdown(cmp.parts),
    ...customStatesToMarkdown(cmp.customStates),
    ...stylesToMarkdown(cmp.styles),
    ...dependencies,
  ];
};

/**
 * Resolves the user-written content (above AUTO_GENERATE_COMMENT) to use when
 * generating a readme, respecting the `overwriteExisting` option and whether
 * the output dir differs from the source dir.
 * @param compilerCtx the current compiler context
 * @param readmeOutput the readme output target config
 * @param readmeOutputPath the full path to the output readme file
 * @param config the Stencil config
 * @param userContent the content located above AUTO_GENERATE_COMMENT in the existing readme, or a default template if no existing readme
 * @returns the content to use as the "user content" (content above AUTO_GENERATE_COMMENT) for the new readme
 */
const resolveUserContent = async (
  compilerCtx: d.CompilerCtx,
  readmeOutput: d.OutputTargetDocsReadme,
  readmeOutputPath: string,
  config: d.ValidatedConfig,
  userContent: string | undefined,
): Promise<string | undefined> => {
  if (readmeOutput.overwriteExisting === true) {
    return userContent;
  }
  if (normalizePath(readmeOutput.dir) !== normalizePath(config.srcDir)) {
    if (
      (readmeOutput.overwriteExisting === 'if-missing' &&
        (await compilerCtx.fs.access(readmeOutputPath))) ||
      (readmeOutput.overwriteExisting ?? false) === false
    ) {
      return getUserReadmeContent(compilerCtx, readmeOutputPath);
    }
  }
  return userContent;
};

const getDocsDeprecation = (cmp: d.JsonDocsComponent) => {
  if (cmp.deprecation !== undefined) {
    return [`> **[DEPRECATED]** ${cmp.deprecation}`, ''];
  }
  return [];
};

/**
 * Get a minimal default README for a Stencil component
 *
 * @param docsData documentation data for the component of interest
 * @returns a minimal README template for that component
 */
const getDefaultReadme = (docsData: d.JsonDocsComponent) => {
  return [`# ${docsData.tag}`, '', '', ''].join('\n');
};

/**
 * Extract the existing CSS Custom Properties section from a README file.
 * This is used to preserve CSS props documentation when running `stencil docs`
 * without building styles.
 *
 * @param compilerCtx the current compiler context
 * @param readmePath the path to the README file to read
 * @returns array of CSS custom properties styles, or undefined if none found
 */
export const extractExistingCssProps = async (
  compilerCtx: d.CompilerCtx,
  readmePath: string,
): Promise<d.JsonDocsStyle[] | undefined> => {
  try {
    const existingContent = await compilerCtx.fs.readFile(readmePath);

    // Find the CSS Custom Properties section
    const cssPropsSectionMatch = existingContent.match(
      /## CSS Custom Properties\s*\n\s*\n([\s\S]*?)(?=\n##|\n-{4,}|$)/,
    );
    if (!cssPropsSectionMatch) {
      return undefined;
    }

    const cssPropsSection = cssPropsSectionMatch[1];
    const styles: d.JsonDocsStyle[] = [];

    // Parse the markdown table to extract CSS custom properties
    // Table format:
    // | Name | Description |
    // | ---- | ----------- |
    // | `--prop-name` | Description text |
    const lines = cssPropsSection.split('\n');
    let inTable = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip header and separator rows
      if (trimmedLine.startsWith('| Name') || trimmedLine.startsWith('| ---')) {
        inTable = true;
        continue;
      }

      // Parse table rows
      if (inTable && trimmedLine.startsWith('|')) {
        const parts = trimmedLine
          .split('|')
          .map((p) => p.trim())
          .filter((p) => p);
        if (parts.length >= 2) {
          // Extract the CSS variable name (remove backticks)
          const name = parts[0].replace(/`/g, '').trim();
          const docs = parts[1].trim();

          if (name.startsWith('--')) {
            styles.push({
              name,
              docs,
              annotation: 'prop',
              mode: undefined,
            });
          }
        }
      }
    }

    return styles.length > 0 ? styles : undefined;
  } catch {
    return undefined;
  }
};

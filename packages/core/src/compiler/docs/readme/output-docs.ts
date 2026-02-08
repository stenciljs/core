import { join, normalizePath, relative } from '@utils';

import type * as d from '../../../declarations';
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

        const currentReadmeContent =
          readmeOutput.overwriteExisting === true
            ? // Overwrite explicitly requested: always use the provided user content.
              userContent
            : normalizePath(readmeOutput.dir) !== normalizePath(config.srcDir)
              ? (readmeOutput.overwriteExisting === 'if-missing' &&
                  // Validate a file exists at the output path
                  (await compilerCtx.fs.access(readmeOutputPath))) ||
                // False and undefined case: follow the changes made in #5648
                (readmeOutput.overwriteExisting ?? false) === false
                ? // Existing file found: The user set a custom `.dir` property, which is
                  // where we're going to write the updated README. We need to read the
                  // non-automatically generated content from that file and preserve that.
                  await getUserReadmeContent(compilerCtx, readmeOutputPath)
                : // No existing file found: use the provided user content.
                  userContent
              : // Default case: writing to srcDir, so use the provided user content.
                userContent;

        // CSS Custom Properties preservation is now handled centrally in outputDocs
        const readmeContent = generateMarkdown(currentReadmeContent, docsData, cmps, readmeOutput, config);

        const results = await compilerCtx.fs.writeFile(readmeOutputPath, readmeContent);
        if (results.changedContent) {
          if (isUpdate) {
            config.logger.info(`updated readme docs: ${docsData.tag}`);
          } else {
            config.logger.info(`created readme docs: ${docsData.tag}`);
          }
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
  //If the readmeOutput.dependencies is true or undefined the dependencies will be generated.
  const dependencies = readmeOutput.dependencies !== false ? depsToMarkdown(cmp, cmps, config) : [];

  return [
    userContent || '',
    AUTO_GENERATE_COMMENT,
    '',
    '',
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
    `----------------------------------------------`,
    '',
    readmeOutput.footer,
    '',
  ].join('\n');
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
  } catch (e) {
    return undefined;
  }
};

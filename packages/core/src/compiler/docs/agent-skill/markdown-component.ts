import type * as d from '@stencil/core';

import { stylesToMarkdown } from '../readme/markdown-css-props';
import { eventsToMarkdown } from '../readme/markdown-events';
import { methodsToMarkdown } from '../readme/markdown-methods';
import { overviewToMarkdown } from '../readme/markdown-overview';
import { partsToMarkdown } from '../readme/markdown-parts';
import { propsToMarkdown } from '../readme/markdown-props';
import { slotsToMarkdown } from '../readme/markdown-slots';
import { usageToMarkdown } from '../readme/markdown-usage';

/**
 * Generate a single component's skill reference file (`components/<tag>.md`),
 * reusing the same pure markdown-formatting functions the `docs-readme`
 * output target uses.
 * @param cmp the component's docs metadata
 * @returns the component's markdown content
 */
export const generateComponentSkillMarkdown = (cmp: d.JsonDocsComponent): string => {
  const lines: string[] = [
    `# ${cmp.tag}`,
    '',
    ...overviewToMarkdown(cmp.overview),
    ...propsToMarkdown(cmp.props),
    ...eventsToMarkdown(cmp.events),
    ...methodsToMarkdown(cmp.methods),
    ...slotsToMarkdown(cmp.slots),
    ...stylesToMarkdown(cmp.styles),
    ...partsToMarkdown(cmp.parts),
    ...usageToMarkdown(cmp.usage),
  ];
  return lines.join('\n');
};

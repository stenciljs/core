import type * as d from '@stencil/core';

import { isOutputTargetDocsAgentSkill, join } from '../../../utils';
import { generateSkillMarkdown } from './frontmatter';
import { generateComponentSkillMarkdown } from './markdown-component';

/**
 * Generate an Agent Skill (`SKILL.md` + `components/*.md`) describing the project's
 * component library.
 * @param compilerCtx the current compiler context
 * @param docsData the generated docs data
 * @param outputTargets the output targets configured for the build
 */
export const generateAgentSkillDocs = async (
  compilerCtx: d.CompilerCtx,
  docsData: d.JsonDocs,
  outputTargets: d.OutputTarget[],
): Promise<void> => {
  const skillOutputs = outputTargets.filter(isOutputTargetDocsAgentSkill);
  if (skillOutputs.length === 0) {
    return;
  }

  await Promise.all(
    skillOutputs.map(async (outputTarget) => {
      const dir = outputTarget.dir!;
      const skillMd = generateSkillMarkdown(docsData, outputTarget);

      await Promise.all([
        compilerCtx.fs.writeFile(join(dir, 'SKILL.md'), skillMd),
        ...docsData.components.map((cmp) =>
          compilerCtx.fs.writeFile(
            join(dir, 'components', `${cmp.tag}.md`),
            generateComponentSkillMarkdown(cmp),
          ),
        ),
      ]);
    }),
  );
};

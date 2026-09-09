import type * as d from '@stencil/core';

import { usageToMarkdown } from '../readme/markdown-usage';

/**
 * Truncate a string to a max length, replacing any trailing content with an ellipsis.
 * @param text the text to truncate
 * @param maxLen the max length of the returned string
 * @returns the truncated string
 */
const truncate = (text: string, maxLen: number): string =>
  text.length > maxLen ? `${text.slice(0, maxLen - 1).trimEnd()}…` : text;

/**
 * Extract the first sentence from a block of text, for use as a short summary.
 * Bounded to the first paragraph (text up to a blank line) so a heading or
 * short first line doesn't get glued to unrelated content further down.
 * Falls back to the full (truncated) first paragraph if no sentence-ending
 * punctuation is found within it.
 * @param text the text to extract a summary from
 * @param maxLen the max length of the returned string
 * @returns the first sentence, or an empty string if `text` is empty
 */
export const firstSentence = (text: string | undefined, maxLen = 200): string => {
  if (!text) {
    return '';
  }
  const trimmed = text.trim();
  if (trimmed === '') {
    return '';
  }
  const firstParagraph = trimmed.split(/\r?\n\s*\r?\n/)[0];
  const match = firstParagraph.match(/^[\s\S]*?[.!?](?=\s|$)/);
  const sentence = (match ? match[0] : firstParagraph).trim();
  return truncate(sentence, maxLen);
};

/**
 * Strip a single leading markdown ATX heading (e.g. `# Getting Started`), if
 * present, so summary extraction starts from the first real paragraph of prose.
 * @param text the text to strip a leading heading from
 * @returns the text with any leading heading removed
 */
const stripLeadingHeading = (text: string): string => text.replace(/^\s*#{1,6}[^\n]*\n+/, '');

/**
 * Sanitize a string into a valid Agent Skill `name` (lowercase, alphanumeric + hyphens).
 * @param raw the raw string to sanitize, e.g. a project namespace
 * @returns the kebab-cased name, or 'skill' if `raw` sanitizes to an empty string
 */
export const toSkillName = (raw: string): string => {
  const kebab = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return kebab || 'skill';
};

/**
 * Auto-generate the skill's `description` when the user doesn't supply one -
 * prefers real project-level usage content (see `<srcDir>/usage/*.md`) over a
 * generic sentence built from the component tag list.
 * @param components the project's documented components
 * @param name the skill's (already-sanitized) name
 * @param projectUsage project-level usage content, from `JsonDocs.usage`
 * @returns the generated description
 */
export const buildSkillDescription = (
  components: ReadonlyArray<d.JsonDocsComponent>,
  name: string,
  projectUsage?: d.JsonDocsUsage,
): string => {
  if (projectUsage) {
    const firstEntry = Object.values(projectUsage)[0];
    const fromProjectUsage = firstEntry ? firstSentence(stripLeadingHeading(firstEntry), 400) : '';
    if (fromProjectUsage) {
      return fromProjectUsage;
    }
  }

  const tags = components.map((cmp) => cmp.tag);
  const description = `Use when building UI with the ${name} component library. Provides API reference and usage examples for its ${
    tags.length
  } component${tags.length === 1 ? '' : 's'}: ${tags.join(', ')}.`;
  return truncate(description, 800);
};

/**
 * Minimal YAML string serializer for the two flat frontmatter fields
 * (`name`/`description`). Quotes and escapes only when necessary - not a
 * general-purpose YAML writer.
 * @param value the string to serialize
 * @returns the value, quoted/escaped if it contains YAML-significant characters
 */
export const escapeYamlString = (value: string): string => {
  const needsQuoting =
    value === '' ||
    /[:#"'\n]/.test(value) ||
    /^\s|\s$/.test(value) ||
    /^[-?*&!|>%@`[\]{},]/.test(value);
  if (!needsQuoting) {
    return value;
  }
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r\n|\r|\n/g, '\\n');
  return `"${escaped}"`;
};

/**
 * Assemble the top-level `SKILL.md` content: frontmatter, project-level intro
 * (from `JsonDocs.usage`, if any), and an index of components linking to
 * their `components/<tag>.md` reference file.
 * @param docsData the project's generated docs data
 * @param outputTarget the (already-validated) docs-agent-skill output target
 * @returns the `SKILL.md` content
 */
export const generateSkillMarkdown = (
  docsData: d.JsonDocs,
  outputTarget: d.OutputTargetDocsAgentSkill,
): string => {
  const name = outputTarget.name!;
  const description =
    outputTarget.description ?? buildSkillDescription(docsData.components, name, docsData.usage);

  const lines: string[] = [
    '---',
    `name: ${escapeYamlString(name)}`,
    `description: ${escapeYamlString(description)}`,
    '---',
    '',
    `# ${name}`,
    '',
  ];

  if (docsData.usage) {
    lines.push(...usageToMarkdown(docsData.usage));
  }

  lines.push('## Components', '');
  [...docsData.components]
    .sort((a, b) => a.tag.localeCompare(b.tag))
    .forEach((cmp) => {
      const summary = firstSentence(cmp.overview);
      lines.push(`- [${cmp.tag}](components/${cmp.tag}.md)${summary ? ` — ${summary}` : ''}`);
    });
  lines.push('');

  return lines.join('\n');
};

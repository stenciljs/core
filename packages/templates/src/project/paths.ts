import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const PROJECT_TEMPLATES = ['component-starter'] as const;
export type ProjectTemplateId = (typeof PROJECT_TEMPLATES)[number];

/**
 * Returns the absolute path to a project template directory.
 * Resolves from the compiled dist/ location up to the sibling templates/ directory.
 *
 * @param templateId - One of the known template identifiers (e.g. `'component-starter'`).
 * @returns Absolute path to the template directory.
 */
export function getTemplatePath(templateId: ProjectTemplateId): string {
  return join(__dirname, '..', 'templates', 'project', templateId);
}

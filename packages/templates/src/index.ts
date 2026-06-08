export type { StyleExtension } from './types.js';
export { getComponentBoilerplate, toPascalCase } from './generate/component.js';
export { getStyleBoilerplate } from './generate/style.js';
export { getTemplatePath, PROJECT_TEMPLATES } from './project/paths.js';
export type { ProjectTemplateId } from './project/paths.js';
export { generateStencilConfig } from './project/config.js';
export type { ConfigSelections, OutputKey, DocKey } from './project/config.js';

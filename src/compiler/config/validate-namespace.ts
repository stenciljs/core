import { buildError, dashToPascalCase, isOutputTargetDist, isString } from '@utils';

import type * as d from '../../declarations';
import { DEFAULT_NAMESPACE } from './constants';

/**
 * Ensures that the `namespace` and `fsNamespace` properties on a project's
 * Stencil config are valid strings. A valid namespace means:
 * - at least 3 characters
 * - cannot start with a number or dash
 * - cannot end with a dash
 * - must only contain alphanumeric, dash, and dollar sign characters
 *
 * If any conditions are not met, a diagnostic is added to the provided array.
 *
 * If a namespace is not provided, the default value is `App`.
 *
 * @param namespace The namespace to validate
 * @param fsNamespace The fsNamespace to validate
 * @param diagnostics The array of diagnostics to add to if the namespace is invalid
 * @returns The validated namespace and fsNamespace
 */
export const validateNamespace = (
  namespace: string | undefined,
  fsNamespace: string | undefined,
  diagnostics: d.Diagnostic[],
) => {
  namespace = isString(namespace) ? namespace : DEFAULT_NAMESPACE;
  namespace = namespace.trim();

  const invalidNamespaceChars = namespace.replace(/(\w)|(\-)|(\$)/g, '');
  if (invalidNamespaceChars !== '') {
    const err = buildError(diagnostics);
    err.messageText = `Namespace "${namespace}" contains invalid characters: ${invalidNamespaceChars}`;
  }
  if (namespace.length < 3) {
    const err = buildError(diagnostics);
    err.messageText = `Namespace "${namespace}" must be at least 3 characters`;
  }
  if (/^\d+$/.test(namespace.charAt(0))) {
    const err = buildError(diagnostics);
    err.messageText = `Namespace "${namespace}" cannot have a number for the first character`;
  }
  if (namespace.charAt(0) === '-') {
    const err = buildError(diagnostics);
    err.messageText = `Namespace "${namespace}" cannot have a dash for the first character`;
  }
  if (namespace.charAt(namespace.length - 1) === '-') {
    const err = buildError(diagnostics);
    err.messageText = `Namespace "${namespace}" cannot have a dash for the last character`;
  }

  // the file system namespace is the one
  // used in filenames and seen in the url
  if (!isString(fsNamespace)) {
    fsNamespace = namespace.toLowerCase().trim();
  }

  if (namespace.includes('-')) {
    // convert to PascalCase
    namespace = dashToPascalCase(namespace);
  }

  return { namespace, fsNamespace };
};

export const validateDistNamespace = (config: d.UnvalidatedConfig, diagnostics: d.Diagnostic[]) => {
  const hasDist = (config.outputTargets ?? []).some(isOutputTargetDist);
  if (hasDist) {
    if (!isString(config.namespace) || config.namespace.toLowerCase() === 'app') {
      const err = buildError(diagnostics);
      err.messageText = `When generating a distribution it is recommended to choose a unique namespace rather than the default setting "App". Please updated the "namespace" config property within the stencil config.`;
    }
  }
};

import { basename, join } from 'path';
import type * as d from '@stencil/core';

import { buildError, dashToPascalCase, isString } from '../../utils';
import { DEFAULT_NAMESPACE } from './constants';

const deriveDefaultNamespace = (rootDir: string, sys: d.CompilerSystem): string => {
  try {
    const pkgContent = sys.readFileSync(join(rootDir, 'package.json'));
    if (pkgContent) {
      const name: unknown = JSON.parse(pkgContent)?.name;
      if (isString(name) && name.length >= 3) {
        return name.replace(/^@[^/]+\//, ''); // strip @scope/ prefix
      }
    }
  } catch {}
  const dirName = basename(rootDir);
  return dirName.length >= 3 ? dirName : DEFAULT_NAMESPACE;
};

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
 * If a namespace is not provided, it is derived from the package.json `name` field,
 * falling back to the root directory name, then `App` as a last resort.
 *
 * @param namespace The namespace to validate
 * @param fsNamespace The fsNamespace to validate
 * @param diagnostics The array of diagnostics to add to if the namespace is invalid
 * @param rootDir The project root directory, used for package.json lookup
 * @param sys The compiler system, used to read package.json
 * @returns The validated namespace and fsNamespace
 */
export const validateNamespace = (
  namespace: string | undefined,
  fsNamespace: string | undefined,
  diagnostics: d.Diagnostic[],
  rootDir?: string,
  sys?: d.CompilerSystem,
) => {
  namespace = isString(namespace)
    ? namespace
    : rootDir && sys
      ? deriveDefaultNamespace(rootDir, sys)
      : DEFAULT_NAMESPACE;
  namespace = namespace.trim();

  const invalidNamespaceChars = namespace.replace(/(\w)|(-)|(\$)/g, '');
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

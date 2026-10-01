import type * as d from '@stencil/core';

/**
 * The shape of a mode-keyed `styleUrls`/`styles` object once the compiler has
 * evaluated the `@Component()` decorator's argument. A single imported style
 * (`import styles from './styles.css'`) is wrapped as `{ __identifier: true, ... }`,
 * which is not mode-keyed and must be excluded from mode-key extraction.
 */
type PossibleModeObject = Record<string, unknown> & { __identifier?: boolean };

const getModeKeys = (value: string[] | PossibleModeObject | string | undefined): string[] => {
  if (value == null || typeof value !== 'object' || Array.isArray(value) || value.__identifier) {
    return [];
  }
  return Object.keys(value);
};

/**
 * The result of an invalid `modes` check on a component's `styleUrls`/`styles`.
 */
export interface ModeValidationError {
  propName: 'styleUrls' | 'styles';
  message: string;
}

/**
 * Validates the mode keys used in a component's `styleUrls`/`styles` against a
 * `config.modes` allowlist, if one is declared.
 * @param configModes the `config.modes` allowlist (mixed string/{@link d.ModeConfig} entries)
 * @param componentOptions the `@Component()` decorator options for a single component
 * @returns a validation error if a used mode is unknown or a required mode is missing, undefined otherwise
 */
export const validateComponentModes = (
  configModes: (string | d.ModeConfig)[] | undefined,
  componentOptions: Pick<d.ComponentOptions, 'styleUrls' | 'styles'>,
): ModeValidationError | undefined => {
  if (!configModes || configModes.length === 0) {
    return undefined;
  }

  const allowedModes = new Map<string, boolean>();
  for (const entry of configModes) {
    if (typeof entry === 'string') {
      allowedModes.set(entry, false);
    } else {
      allowedModes.set(entry.mode, !!entry.required);
    }
  }

  const fields: { propName: 'styleUrls' | 'styles'; keys: string[] }[] = [
    { propName: 'styleUrls', keys: getModeKeys(componentOptions.styleUrls) },
    { propName: 'styles', keys: getModeKeys(componentOptions.styles) },
  ];

  for (const field of fields) {
    for (const key of field.keys) {
      if (!allowedModes.has(key)) {
        return {
          propName: field.propName,
          message: `Invalid mode "${key}" in "${field.propName}". Valid modes are: ${[...allowedModes.keys()].join(', ')}.`,
        };
      }
    }
  }

  const usedModes = new Set([...fields[0].keys, ...fields[1].keys]);
  if (usedModes.size > 0) {
    const missingRequired = [...allowedModes.entries()]
      .filter(([mode, required]) => required && !usedModes.has(mode))
      .map(([mode]) => mode);

    if (missingRequired.length > 0) {
      return {
        propName: fields[0].keys.length > 0 ? 'styleUrls' : 'styles',
        message: `Missing required mode${missingRequired.length > 1 ? 's' : ''}: ${missingRequired.join(', ')}.`,
      };
    }
  }

  return undefined;
};

/**
 * Validates that a component tag meets required naming conventions to be used for a web component
 * @param tag the tag to validate
 * @returns an error message if the tag has an invalid name, undefined if the tag name passes all checks
 */
export const validateComponentTag = (tag: string): string | undefined => {
  // we want to check this first since we call some String.prototype methods below
  if (typeof tag !== 'string') {
    return `Tag "${tag}" must be a string type`;
  }
  if (tag !== tag.trim()) {
    return `Tag can not contain white spaces`;
  }
  if (tag !== tag.toLowerCase()) {
    return `Tag can not contain upper case characters`;
  }
  if (tag.length === 0) {
    return `Received empty tag value`;
  }

  if (tag.indexOf(' ') > -1) {
    return `"${tag}" tag cannot contain a space`;
  }

  if (tag.indexOf(',') > -1) {
    return `"${tag}" tag cannot be used for multiple tags`;
  }

  const invalidChars = tag.replace(/\w|-/g, '');
  if (invalidChars !== '') {
    return `"${tag}" tag contains invalid characters: ${invalidChars}`;
  }

  if (tag.indexOf('-') === -1) {
    return `"${tag}" tag must contain a dash (-) to work as a valid web component`;
  }

  if (tag.indexOf('--') > -1) {
    return `"${tag}" tag cannot contain multiple dashes (--) next to each other`;
  }

  if (tag.indexOf('-') === 0) {
    return `"${tag}" tag cannot start with a dash (-)`;
  }

  if (tag.lastIndexOf('-') === tag.length - 1) {
    return `"${tag}" tag cannot end with a dash (-)`;
  }
  return undefined;
};

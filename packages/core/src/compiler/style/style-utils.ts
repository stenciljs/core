/**
 * Wrap CSS content according to the modifiers trailing an `@import` specifier
 * (`layer(name)`, `supports(condition)`, and/or a media query), mirroring what
 * `@import url(...) layer(name) supports(condition) (media);` would do natively.
 *
 * @param cssText the CSS content to wrap
 * @param modifiers the raw modifier string following the import specifier, if any
 * @returns cssText wrapped in @layer/@media/@supports blocks as needed
 */
export const wrapCssWithImportModifiers = (
  cssText: string,
  modifiers: string | undefined,
): string => {
  if (!modifiers?.trim()) {
    return cssText;
  }

  let remaining = modifiers.trim();
  let replacement = cssText;
  let layerName = '';
  let supportsCondition = '';

  // Extract layer() - innermost wrapper
  const layerMatch = remaining.match(/layer\(([^)]+)\)/);
  if (layerMatch) {
    layerName = layerMatch[1].trim();
    remaining = remaining.replace(/layer\([^)]+\)/, '').trim();
  }

  // Extract supports() - handles nested parentheses with a balanced-paren scan
  let depth = 0;
  let startIdx = -1;
  let endIdx = -1;
  const supportsIdx = remaining.indexOf('supports(');

  if (supportsIdx !== -1) {
    startIdx = supportsIdx + 9; // length of 'supports('
    for (let i = startIdx; i < remaining.length; i++) {
      if (remaining[i] === '(') depth++;
      if (remaining[i] === ')') {
        if (depth === 0) {
          endIdx = i;
          break;
        }
        depth--;
      }
    }

    if (endIdx !== -1) {
      supportsCondition = remaining.substring(startIdx, endIdx).trim();
      remaining = remaining.substring(0, supportsIdx) + remaining.substring(endIdx + 1);
      remaining = remaining.trim();
    }
  }

  // Anything remaining should be a media query
  const mediaQuery = remaining.trim();

  // Apply wrappers in correct order: layer (innermost) -> media -> supports (outermost)
  if (layerName) {
    replacement = `@layer ${layerName} {\n${replacement}\n}`;
  }

  if (mediaQuery) {
    replacement = `@media ${mediaQuery} {\n${replacement}\n}`;
  }

  if (supportsCondition) {
    replacement = `@supports (${supportsCondition}) {\n${replacement}\n}`;
  }

  return replacement;
};

/**
 * Strip out comments from some CSS
 *
 * @param input the string we'd like to de-comment
 * @returns de-commented CSS!
 */
export const stripCssComments = (input: string): string => {
  let isInsideString = null;
  let currentCharacter = '';
  let returnValue = '';

  for (let i = 0; i < input.length; i++) {
    currentCharacter = input[i];

    if (input[i - 1] !== '\\') {
      if (currentCharacter === '"' || currentCharacter === "'") {
        if (isInsideString === currentCharacter) {
          isInsideString = null;
        } else if (!isInsideString) {
          isInsideString = currentCharacter;
        }
      }
    }

    // Find beginning of /* type comment
    if (!isInsideString && currentCharacter === '/' && input[i + 1] === '*') {
      // Ignore important comment when configured to preserve comments using important syntax: /*!
      let j = i + 2;

      // Iterate over comment
      for (; j < input.length; j++) {
        // Find end of comment
        if (input[j] === '*' && input[j + 1] === '/') {
          break;
        }
      }
      // Resume iteration over CSS string from the end of the comment
      i = j + 1;
      continue;
    }

    returnValue += currentCharacter;
  }
  return returnValue;
};

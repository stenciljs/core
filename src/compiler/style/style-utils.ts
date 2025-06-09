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

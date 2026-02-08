import { overviewToMarkdown } from '../readme/markdown-overview';

describe('markdown-overview', () => {
  describe('overviewToMarkdown', () => {
    it('returns no overview if no docs exist', () => {
      const generatedOverview = overviewToMarkdown('').join('\n');

      expect(generatedOverview).toBe('');
    });

    it('generates a single line overview', () => {
      const generatedOverview = overviewToMarkdown('This is a custom button component').join('\n');

      expect(generatedOverview).toBe(`## Overview

This is a custom button component
`);
    });

    it('generates a multi-line overview', () => {
      const description = `This is a custom button component.
It is to be used throughout the design system.

This is a comment followed by a newline.
`;
      const generatedOverview = overviewToMarkdown(description).join('\n');

      expect(generatedOverview).toBe(`## Overview

This is a custom button component.
It is to be used throughout the design system.

This is a comment followed by a newline.
`);
    });

    it('trims all leading newlines & leaves one at the end', () => {
      const description = `
This is a custom button component.

`;
      const generatedOverview = overviewToMarkdown(description).join('\n');

      expect(generatedOverview).toBe(`## Overview

This is a custom button component.
`);
    });
  });
});

/**
 * Options for [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog), which is
 * used to generate the Stencil changelog at release time.
 */
module.exports = {
  parserOpts: {
    /**
     * Override the conventional-changelog parser default configuration and any provided preset (e.g. 'Angular') for
     * detecting issues. Stencil uses the "Angular preset", which defaults the "issuesPrefixes" field to a single pound
     * sign ('#'). This sometimes gets mistaken by the changelog generator as an issue that is fixed, when it fact it's
     * cross-reference to another issue.
     *
     * Note: Only the git commit message is being parsed, not the GitHub Issue summary. For any of the values below to
     * be picked up by conventional-changelog, they must be added to the git commit message.
     *
     * Reference for this property: [GitHub README]{@link https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-commits-parser#issueprefixes}
     * By default, [these are case-insensitive]{@link https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-commits-parser#issueprefixescasesensitive)}
     */
    issuePrefixes: [
      'fixes: #',
      'fixes:#',
      'fixes- #',
      'fixes-#',
      'fixes #',
      'fixes#',
      'closes: #',
      'closes:#',
      'closes- #',
      'closes-#',
      'closes #',
      'closes#',
    ],
  },
};

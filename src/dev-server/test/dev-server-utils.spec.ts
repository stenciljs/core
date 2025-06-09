import { isCssFile, isHtmlFile } from '../dev-server-utils';

describe('dev-server-utils', () => {
  describe('isHtmlFile', () => {
    it.each(['.html', 'foo.html', 'foo/bar.html'])('returns true for .html files (%s)', (filename) => {
      expect(isHtmlFile(filename)).toEqual(true);
    });

    it.each(['.htm', 'foo.htm', 'foo/bar.htm'])('returns true for .htm files (%s)', (filename) => {
      expect(isHtmlFile(filename)).toEqual(true);
    });

    it.each(['.ht', 'foo.htmx', 'foo/bar.xaml'])('returns false for other types of files (%s)', (filename) => {
      expect(isHtmlFile(filename)).toEqual(false);
    });

    it.each(['.hTMl', 'foo.HTML', 'foo/bar.htmL'])('is case insensitive for filename (%s)', (filename) => {
      expect(isHtmlFile(filename)).toEqual(true);
    });
  });

  describe('isCssFile', () => {
    it.each(['.css', 'foo.css', 'foo/bar.css'])('returns true for .css files (%s)', (filename) => {
      expect(isCssFile(filename)).toEqual(true);
    });

    it.each(['.txt', 'foo.sass', 'foo/bar.htm'])('returns false for other types of files (%s)', (filename) => {
      expect(isCssFile(filename)).toEqual(false);
    });

    it.each(['.cSs', 'foo.cSS', 'foo/bar.CSS'])('is case insensitive for filename (%s)', (filename) => {
      expect(isCssFile(filename)).toEqual(true);
    });
  });
});

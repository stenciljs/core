import { isRemoteUrl } from '../url-paths';

describe('url-paths', () => {
  describe('isRemoteUrl', () => {
    it.each(['http://domain.com/file.txt', 'HTTP://domain.com/file.txt'])(
      "returns true for the http protocol '%s'",
      (url) => {
        expect(isRemoteUrl(url)).toBe(true);
      },
    );

    it.each(['https://domain.com/file.txt', 'HTTPS://domain.com/file.txt'])(
      "returns true for the https protocol '%s'",
      (url) => {
        expect(isRemoteUrl(url)).toBe(true);
      },
    );

    it.each(['C:/file.txt', 'C:\\file.txt', '/User/file.txt'])("returns false for file paths '%s'", (fileName) => {
      expect(isRemoteUrl(fileName)).toBe(false);
    });

    it('returns false if the provided url is an empty string', () => {
      expect(isRemoteUrl('')).toBe(false);
    });

    it('returns false if the provided url is not a string', () => {
      // to facilitate the `isString()` check, we provide `null` as an argument. this violates the function signature,
      // requiring a type assertion here
      expect(isRemoteUrl(null as unknown as string)).toBe(false);
    });
  });
});

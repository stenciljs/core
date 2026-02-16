import { isRootPath } from '../is-root-path';

describe('isRootPath', () => {
  it('is root', () => {
    expect(isRootPath('/')).toBe(true);
    expect(isRootPath('c:\\')).toBe(true);
    expect(isRootPath('C:\\')).toBe(true);
    expect(isRootPath('D:\\')).toBe(true);
    expect(isRootPath('c:/')).toBe(true);
    expect(isRootPath('C:/')).toBe(true);
    expect(isRootPath('\\')).toBe(true);
  });

  it('is not root', () => {
    expect(isRootPath('/Users')).toBe(false);
    expect(isRootPath('Users')).toBe(false);
    expect(isRootPath('Users/')).toBe(false);
    expect(isRootPath('/Users/')).toBe(false);
    expect(isRootPath('/.')).toBe(false);
    expect(isRootPath('./')).toBe(false);
    expect(isRootPath('.')).toBe(false);
    expect(isRootPath('')).toBe(false);
    expect(isRootPath(' ')).toBe(false);
    expect(isRootPath('c://')).toBe(false);
    expect(isRootPath('C:\\dir')).toBe(false);
    expect(isRootPath('C')).toBe(false);
    expect(isRootPath('D:')).toBe(false);
    expect(isRootPath('\\\\')).toBe(false);
  });
});

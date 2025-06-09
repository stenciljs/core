import fs from 'fs-extra';

import { BuildOptions } from '../options';

// `open` must be mocked before importing the module under test
const openMock = jest.fn();
jest.mock('open', () => openMock);

import { postGithubRelease } from '../release-utils';

describe('release-utils', () => {
  describe('postGithubRelease', () => {
    jest.useFakeTimers().setSystemTime(new Date('2022-01-01').getTime());

    let buildOptions: BuildOptions;

    let mockReadFile: jest.SpyInstance<ReturnType<typeof fs.readFile>, Parameters<typeof fs.readFile>>;

    beforeEach(() => {
      mockReadFile = jest.spyOn(fs, 'readFile');

      buildOptions = {
        changelogPath: 'some/mock/CHANGELOG.md',
        ghRepoName: 'stencil',
        ghRepoOrg: 'ionic-team',
        tag: 'dev',
        vermoji: '🚗',
        version: '0.0.0',
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it('creates an empty body if the changelog is empty', async () => {
      // Jest isn't smart enough to pick the correct overloaded method, so we must do type assertions to get our spy to
      // return a string (as if we called the original with an encoding argument)
      mockReadFile.mockResolvedValue('' as unknown as Buffer);

      await postGithubRelease(buildOptions);

      expect(openMock).toHaveBeenCalledTimes(1);
      expect(openMock).toHaveBeenCalledWith(
        'https://github.com/ionic-team/stencil/releases/new?tag=v0.0.0&title=%F0%9F%9A%97+0.0.0+%282022-01-01%29&body=',
      );
    });

    it('splits a minor release from a previous patch release', async () => {
      const minorReleaseFollowingPatch = `# 🍣 [2.13.0](https://github.com/ionic-team/stencil/compare/v2.12.1...v2.13.0) (2022-01-24)


### Features

* **mock-doc:** add simple MockEvent#composedPath() impl ([#3204](https://github.com/ionic-team/stencil/issues/3204)) ([7b47d96](https://github.com/ionic-team/stencil/commit/7b47d96e1e3c6c821d5c416fbe987646b4cd1551))
* **test:** jest 27 support ([#3189](https://github.com/ionic-team/stencil/issues/3189)) ([10efeb6](https://github.com/ionic-team/stencil/commit/10efeb6f74888f05a13a47d8afc00b5e83a3f3db))



## 🍔 [2.12.1](https://github.com/ionic-team/stencil/compare/v2.12.0...v2.12.1) (2022-01-04)


### Bug Fixes

* **vdom:** properly warn for step attr on input ([#3196](https://github.com/ionic-team/stencil/issues/3196)) ([7ffc02e](https://github.com/ionic-team/stencil/commit/7ffc02e5d07b05de45cbaf4f0cce3f3e165b3eb0))


### Features

* **typings:** add optional key and ref to slot elements ([#3177](https://github.com/ionic-team/stencil/issues/3177)) ([ce27a18](https://github.com/ionic-team/stencil/commit/ce27a18ba8ecdb2cc5401470747a7e9d91e40a44))
`;

      // Jest isn't smart enough to pick the correct overloaded method, so we must do type assertions to get our spy to
      // return a string (as if we called the original with an encoding argument)
      mockReadFile.mockResolvedValue(minorReleaseFollowingPatch as unknown as Buffer);

      await postGithubRelease(buildOptions);

      expect(openMock).toHaveBeenCalledTimes(1);
      expect(openMock).toHaveBeenCalledWith(
        'https://github.com/ionic-team/stencil/releases/new?tag=v0.0.0&title=%F0%9F%9A%97+0.0.0+%282022-01-01%29&body=%23%23%23+Features%0A%0A*+**mock-doc%3A**+add+simple+MockEvent%23composedPath%28%29+impl+%28%5B%233204%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fissues%2F3204%29%29+%28%5B7b47d96%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fcommit%2F7b47d96e1e3c6c821d5c416fbe987646b4cd1551%29%29%0A*+**test%3A**+jest+27+support+%28%5B%233189%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fissues%2F3189%29%29+%28%5B10efeb6%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fcommit%2F10efeb6f74888f05a13a47d8afc00b5e83a3f3db%29%29',
      );
    });

    it('splits a minor release from a previous minor release', async () => {
      const minorReleaseFollowingMinor = `# ⛸ [2.12.0](https://github.com/ionic-team/stencil/compare/v2.11.0...v2.12.0) (2021-12-13)


### Bug Fixes

* **cli:** wait for help task to finish before exiting ([#3160](https://github.com/ionic-team/stencil/issues/3160)) ([f10cee1](https://github.com/ionic-team/stencil/commit/f10cee12a8d00e7581fcf13216f01ded46227f49))
* **mock-doc:** make Node.contains() return true for self ([#3150](https://github.com/ionic-team/stencil/issues/3150)) ([f164407](https://github.com/ionic-team/stencil/commit/f164407f7463faba7a3c39afca942c2a26210b82))
* **mock-doc:** allow urls as css values ([#2857](https://github.com/ionic-team/stencil/issues/2857)) ([6faa5f2](https://github.com/ionic-team/stencil/commit/6faa5f2f196ff786ffc4b818ac09708ba5de9b35))
* **sourcemaps:** do not encode inline sourcemaps ([#3163](https://github.com/ionic-team/stencil/issues/3163)) ([b2eb083](https://github.com/ionic-team/stencil/commit/b2eb083306802645ee6e31987917dea942882e46)), closes [#3147](https://github.com/ionic-team/stencil/issues/3147)


### Features

* **dist-custom-elements-bundle:** add deprecation warning ([#3167](https://github.com/ionic-team/stencil/issues/3167)) ([c7b07c6](https://github.com/ionic-team/stencil/commit/c7b07c65265c7d4715f29835632cc6538ea63585))



# 🐌 [2.11.0](https://github.com/ionic-team/stencil/compare/v2.11.0-0...v2.11.0) (2021-11-22)


### Bug Fixes

* **dist-custom-elements:** add ssr checks ([#3131](https://github.com/ionic-team/stencil/issues/3131)) ([9a232ea](https://github.com/ionic-team/stencil/commit/9a232ea368324f49993bd079cfdbc344abd0c69e))


### Features

* **css:** account for escaped ':' in css selectors ([#3087](https://github.com/ionic-team/stencil/issues/3087)) ([6000681](https://github.com/ionic-team/stencil/commit/600068168c86dba9ea610b5e8a0dbba00ff4d1f4))
`;

      // Jest isn't smart enough to pick the correct overloaded method, so we must do type assertions to get our spy to
      // return a string (as if we called the original with an encoding argument)
      mockReadFile.mockResolvedValue(minorReleaseFollowingMinor as unknown as Buffer);

      await postGithubRelease(buildOptions);

      expect(openMock).toHaveBeenCalledTimes(1);
      expect(openMock).toHaveBeenCalledWith(
        'https://github.com/ionic-team/stencil/releases/new?tag=v0.0.0&title=%F0%9F%9A%97+0.0.0+%282022-01-01%29&body=%23%23%23+Bug+Fixes%0A%0A*+**cli%3A**+wait+for+help+task+to+finish+before+exiting+%28%5B%233160%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fissues%2F3160%29%29+%28%5Bf10cee1%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fcommit%2Ff10cee12a8d00e7581fcf13216f01ded46227f49%29%29%0A*+**mock-doc%3A**+make+Node.contains%28%29+return+true+for+self+%28%5B%233150%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fissues%2F3150%29%29+%28%5Bf164407%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fcommit%2Ff164407f7463faba7a3c39afca942c2a26210b82%29%29%0A*+**mock-doc%3A**+allow+urls+as+css+values+%28%5B%232857%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fissues%2F2857%29%29+%28%5B6faa5f2%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fcommit%2F6faa5f2f196ff786ffc4b818ac09708ba5de9b35%29%29%0A*+**sourcemaps%3A**+do+not+encode+inline+sourcemaps+%28%5B%233163%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fissues%2F3163%29%29+%28%5Bb2eb083%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fcommit%2Fb2eb083306802645ee6e31987917dea942882e46%29%29%2C+closes+%5B%233147%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fissues%2F3147%29%0A%0A%0A%23%23%23+Features%0A%0A*+**dist-custom-elements-bundle%3A**+add+deprecation+warning+%28%5B%233167%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fissues%2F3167%29%29+%28%5Bc7b07c6%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fcommit%2Fc7b07c65265c7d4715f29835632cc6538ea63585%29%29',
      );
    });

    it('splits a patch release from a previous patch release', async () => {
      const patchReleaseFollowingPatch = `## ♨️ [2.12.2](https://github.com/ionic-team/stencil/compare/v2.12.1...v2.12.2) (2022-01-24)


### Features

* **mock-doc:** add simple MockEvent#composedPath() impl ([#3204](https://github.com/ionic-team/stencil/issues/3204)) ([7b47d96](https://github.com/ionic-team/stencil/commit/7b47d96e1e3c6c821d5c416fbe987646b4cd1551))
* **test:** jest 27 support ([#3189](https://github.com/ionic-team/stencil/issues/3189)) ([10efeb6](https://github.com/ionic-team/stencil/commit/10efeb6f74888f05a13a47d8afc00b5e83a3f3db))



## 🍔 [2.12.1](https://github.com/ionic-team/stencil/compare/v2.12.0...v2.12.1) (2022-01-04)


### Bug Fixes

* **vdom:** properly warn for step attr on input ([#3196](https://github.com/ionic-team/stencil/issues/3196)) ([7ffc02e](https://github.com/ionic-team/stencil/commit/7ffc02e5d07b05de45cbaf4f0cce3f3e165b3eb0))


### Features

* **typings:** add optional key and ref to slot elements ([#3177](https://github.com/ionic-team/stencil/issues/3177)) ([ce27a18](https://github.com/ionic-team/stencil/commit/ce27a18ba8ecdb2cc5401470747a7e9d91e40a44))
`;

      // Jest isn't smart enough to pick the correct overloaded method, so we must do type assertions to get our spy to
      // return a string (as if we called the original with an encoding argument)
      mockReadFile.mockResolvedValue(patchReleaseFollowingPatch as unknown as Buffer);

      await postGithubRelease(buildOptions);

      expect(openMock).toHaveBeenCalledTimes(1);
      expect(openMock).toHaveBeenCalledWith(
        'https://github.com/ionic-team/stencil/releases/new?tag=v0.0.0&title=%F0%9F%9A%97+0.0.0+%282022-01-01%29&body=%23%23%23+Features%0A%0A*+**mock-doc%3A**+add+simple+MockEvent%23composedPath%28%29+impl+%28%5B%233204%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fissues%2F3204%29%29+%28%5B7b47d96%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fcommit%2F7b47d96e1e3c6c821d5c416fbe987646b4cd1551%29%29%0A*+**test%3A**+jest+27+support+%28%5B%233189%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fissues%2F3189%29%29+%28%5B10efeb6%5D%28https%3A%2F%2Fgithub.com%2Fionic-team%2Fstencil%2Fcommit%2F10efeb6f74888f05a13a47d8afc00b5e83a3f3db%29%29',
      );
    });
  });
});

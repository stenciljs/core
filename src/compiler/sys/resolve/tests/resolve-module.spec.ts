import {
  getModuleId,
  getPackageDirPath,
  isLocalModule,
  isNodeModulePath,
  isStencilCoreImport,
  setPackageVersionByContent,
} from '../resolve-utils';

describe('resolve modules', () => {
  const pkgVersions = new Map<string, string>();
  beforeEach(() => {
    pkgVersions.clear();
  });

  it('isStencilCoreImport', () => {
    expect(isStencilCoreImport('@stencil/core')).toBe(true);
    expect(isStencilCoreImport('@stencil/core/internal')).toBe(true);
    expect(isStencilCoreImport('@stencil/core/internal/client')).toBe(true);
    expect(isStencilCoreImport('@stencil/core/internal/client/index.mjs')).toBe(true);
    expect(isStencilCoreImport('lodash')).toBe(false);
    expect(isStencilCoreImport('@ionic/core')).toBe(false);
  });

  it('isLocalModule', () => {
    expect(isLocalModule('./local.tsx')).toBe(true);
    expect(isLocalModule('/local.tsx')).toBe(true);
    expect(isLocalModule('lodash')).toBe(false);
    expect(isLocalModule('@ionic/core')).toBe(false);
  });

  it('isNodeModulePath', () => {
    expect(isNodeModulePath('/path/to/local/module/index.js')).toBe(false);
    expect(isNodeModulePath('/path/to/node_modules/lodash/index.js')).toBe(true);
    expect(isNodeModulePath('/node_modules/lodash/index.js')).toBe(true);
    expect(isNodeModulePath('C:\\path\\to\\node_modules\\lodash\\index.js')).toBe(true);
    expect(isNodeModulePath('C:\\path\\to\\local\\index.js')).toBe(false);
  });

  describe('getModuleId', () => {
    it('getModuleId non-scoped ~ package', () => {
      const m = getModuleId('~ionicons/dist/css/ionicons.css');
      expect(m.moduleId).toBe('ionicons');
      expect(m.filePath).toBe('dist/css/ionicons.css');
      expect(m.scope).toBe(null);
      expect(m.scopeSubModuleId).toBe(null);
    });

    it('getModuleId non-scoped package', () => {
      const m = getModuleId('ionicons/dist/css/ionicons.css');
      expect(m.moduleId).toBe('ionicons');
      expect(m.filePath).toBe('dist/css/ionicons.css');
      expect(m.scope).toBe(null);
      expect(m.scopeSubModuleId).toBe(null);
    });

    it('getModuleId non-scoped package, no path', () => {
      const m = getModuleId('ionicons');
      expect(m.moduleId).toBe('ionicons');
      expect(m.filePath).toBe('');
      expect(m.scope).toBe(null);
      expect(m.scopeSubModuleId).toBe(null);
    });

    it('getModuleId scoped ~ package', () => {
      const m = getModuleId('~@ionic/core/dist/ionic/css/ionic.css');
      expect(m.moduleId).toBe('@ionic/core');
      expect(m.filePath).toBe('dist/ionic/css/ionic.css');
      expect(m.scope).toBe('@ionic');
      expect(m.scopeSubModuleId).toBe('core');
    });

    it('getModuleId scoped package', () => {
      const m = getModuleId('@ionic/core/dist/ionic/css/ionic.css');
      expect(m.moduleId).toBe('@ionic/core');
      expect(m.filePath).toBe('dist/ionic/css/ionic.css');
      expect(m.scope).toBe('@ionic');
      expect(m.scopeSubModuleId).toBe('core');
    });

    it('getModuleId scoped package, no path', () => {
      const m = getModuleId('@ionic/core');
      expect(m.moduleId).toBe('@ionic/core');
      expect(m.filePath).toBe('');
      expect(m.scope).toBe('@ionic');
      expect(m.scopeSubModuleId).toBe('core');
    });
  });

  it('getPackageDirPath', () => {
    expect(getPackageDirPath('/node_modules/@my/pkg/some/path.js', '@my/pkg')).toBe('/node_modules/@my/pkg');
    expect(getPackageDirPath('\\node_modules\\my-pkg\\', 'my-pkg')).toBe('/node_modules/my-pkg');
    expect(getPackageDirPath('/node_modules/my-pkg/', 'my-pkg')).toBe('/node_modules/my-pkg');
    expect(getPackageDirPath('/node_modules/my-pkg/some/path.js', 'my-pkg')).toBe('/node_modules/my-pkg');
    expect(getPackageDirPath('/node_modules/something/node_modules/my-pkg/some/path.js', 'my-pkg')).toBe(
      '/node_modules/something/node_modules/my-pkg',
    );
    expect(getPackageDirPath('/node_modules/idk/some/path.js', 'my-pkg')).toBe(null);
    expect(getPackageDirPath('/my-pkg/node_modules/some/path.js', 'my-pkg')).toBe(null);
    expect(getPackageDirPath('/node_modules/some/my-pkg/path.js', 'my-pkg')).toBe(null);
  });

  describe('setPackageVersionByContent', () => {
    it('set scoped package', () => {
      const pkgContent = JSON.stringify({
        name: '@ionic/core',
        version: '1.2.3',
      });
      setPackageVersionByContent(pkgVersions, pkgContent);
      expect(pkgVersions.get('@ionic/core')).toBe('1.2.3');
    });

    it('set package', () => {
      const pkgContent = JSON.stringify({
        name: 'lodash',
        version: '1.2.3',
      });
      setPackageVersionByContent(pkgVersions, pkgContent);
      expect(pkgVersions.get('lodash')).toBe('1.2.3');
    });
  });
});

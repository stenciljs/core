import { mockValidatedConfig } from '@stencil/core/testing';

import { getRelativeDts } from '../run-program';

describe('run-program.ts', () => {
  describe('getRelativeDts', () => {
    it('should find the relative path to write a dts file to', () => {
      const config = mockValidatedConfig({ srcDir: '/Testuser/stencil-project/src' });
      const foo = getRelativeDts(
        config,
        '/Testuser/stencil-project/src/index.ts',
        '/Testuser/stencil-project/.stencil/index.d.ts',
      );
      expect(foo).toBe('index.d.ts');
    });

    it('should find the relative path to write a nested dts file to', () => {
      const config = mockValidatedConfig({ srcDir: '/Testuser/stencil-project/src' });
      const foo = getRelativeDts(
        config,
        '/Testuser/stencil-project/src/components/index.ts',
        '/Testuser/stencil-project/.stencil/components/index.d.ts',
      );
      expect(foo).toBe('./components/index.d.ts');
    });

    it('should find the relative path to write a dts file to (windows)', () => {
      const config = mockValidatedConfig({ srcDir: 'C:\\Testuser\\stencil-project\\src' });
      const foo = getRelativeDts(
        config,
        'C:/Testuser/stencil-project/src/index.ts',
        'C:/Testuser/stencil-project/.stencil/index.d.ts',
      );
      expect(foo).toBe('index.d.ts');
    });

    it('should find the relative path to write a nested dts file to (windows)', () => {
      const config = mockValidatedConfig({ srcDir: 'C:\\Testuser\\stencil-project\\src' });
      const foo = getRelativeDts(
        config,
        'C:/Testuser/stencil-project/src/components/index.ts',
        'C:/Testuser/stencil-project/.stencil/components/index.d.ts',
      );
      expect(foo).toBe('./components/index.d.ts');
    });
  });
});

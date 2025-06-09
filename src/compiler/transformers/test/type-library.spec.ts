import { ValidatedConfig } from '@stencil/core/declarations';
import { mockLogger, mockValidatedConfig, setupConsoleMocker } from '@stencil/core/testing';
import { normalizePath } from '@utils';
import { relative } from '@utils';
import path from 'path';

import { addFileToLibrary, getTypeLibrary } from '../type-library';

function resetLibrary() {
  const library = getTypeLibrary();

  for (const key in library) {
    delete library[key];
  }
}

const fixturesDir = 'fixtures';
const dessertModulePath = normalizePath(path.join(__dirname, fixturesDir, 'dessert.ts'), false);
const mealModulePath = normalizePath(path.join(__dirname, fixturesDir, 'meal-entry.ts'), false);

describe('type library', () => {
  let config: ValidatedConfig;

  beforeEach(() => {
    config = mockValidatedConfig({
      rootDir: process.cwd(),
    });
  });

  afterEach(() => {
    resetLibrary();
  });

  it("should issue a warning if it can't find the specified file", () => {
    const { setupConsoleMocks, teardownConsoleMocks } = setupConsoleMocker();
    const { warnMock } = setupConsoleMocks();
    const logger = mockLogger();
    logger.enable();
    config.logger = logger;
    addFileToLibrary(config, 'fixtures/not-found.ts');
    expect(warnMock).toHaveBeenCalledWith(
      'docs-json: unable to gather type information from "fixtures/not-found.ts". Please double check this path exists relative to your project root.',
    );
    teardownConsoleMocks();
  });

  it('should include an enum', () => {
    addFileToLibrary(config, mealModulePath);

    const relativePath = relative(config.rootDir, mealModulePath);

    expect(getTypeLibrary()[`${relativePath}::BestEnum`]).toEqual({
      declaration: `export enum BestEnum {
  Best,
  Worst,
  JustAlright,
}`,
      docstring: 'This has some documentation!',
      path: relativePath,
    });
  });

  it('should include a string union', () => {
    addFileToLibrary(config, mealModulePath);

    const relativePath = relative(config.rootDir, mealModulePath);

    expect(getTypeLibrary()[`${relativePath}::StringUnion`]).toEqual({
      declaration: `export type StringUnion = 'left' | 'right';`,
      docstring: '',
      path: relativePath,
    });
  });

  it('should include a simple alias', () => {
    addFileToLibrary(config, mealModulePath);

    const relativePath = relative(config.rootDir, mealModulePath);

    expect(getTypeLibrary()[`${relativePath}::JustAnAlias`]).toEqual({
      declaration: `string`,
      docstring: '',
      path: relativePath,
    });
  });

  it('should exclude any private types', () => {
    addFileToLibrary(config, mealModulePath);
    const relativePath = relative(config.rootDir, mealModulePath);
    expect(getTypeLibrary()[`${relativePath}::PrivateType`]).toBeUndefined();
  });

  it('should include an aliased type re-export', () => {
    addFileToLibrary(config, mealModulePath);

    const relativePath = relative(config.rootDir, dessertModulePath);

    expect(getTypeLibrary()[`${relativePath}::IceCream`]).toEqual({
      declaration: `export interface IceCream {
  delicious: true;
  flavor: string;
}`,
      docstring: '',
      path: relativePath,
    });
  });

  it('should include an aliased re-export', () => {
    addFileToLibrary(config, mealModulePath);

    const relativePath = relative(config.rootDir, dessertModulePath);

    expect(getTypeLibrary()[`${relativePath}::Cake`]).toEqual({
      declaration: `export interface Cake {
  not: 'pie';
}`,
      docstring: '',
      path: relativePath,
    });
  });

  it('should include a type re-export', () => {
    addFileToLibrary(config, mealModulePath);

    const relativePath = relative(config.rootDir, dessertModulePath);

    expect(getTypeLibrary()[`${relativePath}::Pie`]).toEqual({
      declaration: `export interface Pie {
  type: 'pumpkin' | 'apple' | 'pecan';
}`,
      docstring: '',
      path: relativePath,
    });
  });

  it('should include a re-export', () => {
    addFileToLibrary(config, mealModulePath);

    const relativePath = relative(config.rootDir, dessertModulePath);

    expect(getTypeLibrary()[`${relativePath}::Cookie`]).toEqual({
      declaration: `export interface Cookie {
  goodWith: 'cake';
}`,
      docstring: '',
      path: relativePath,
    });
  });

  it('should include a type when `export *` is used', () => {
    addFileToLibrary(config, mealModulePath);

    const relativePath = relative(config.rootDir, dessertModulePath);

    expect(getTypeLibrary()[`${relativePath}::Candy`]).toEqual({
      declaration: `export interface Candy {
  sweet: 'very yes';
}`,
      docstring: '',
      path: relativePath,
    });
  });
});

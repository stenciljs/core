import { config as baseConfig } from './stencil.config';

/**
 * We are using a slightly different tsconfig to build the end-to-end tests
 * as we are doing type assertions on the hydrate module which is not available
 * when the project hasn't been built.
 */
baseConfig.tsconfig = './tsconfig.build.json';
export const config = baseConfig;

import { Config } from '@stencil/core';

export const config: Config = {
  hashedFileNameLength: 27,
  flags: {
    dev: true,
  },
  extras: {
    enableImportInjection: true,
  },
};

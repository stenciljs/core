import type * as d from '@stencil/core/declarations';
import { mockConfig, mockLoadConfigInit } from '@stencil/core/testing';

import { validateConfig } from '../../config/validate-config';
import { generateServiceWorkerUrl } from '../service-worker-util';

describe('generateServiceWorkerUrl', () => {
  let userConfig: d.Config;
  let outputTarget: d.OutputTargetWww;

  it('sw url w/ baseUrl', () => {
    userConfig = mockConfig({
      devMode: false,
      outputTargets: [
        {
          type: 'www',
          baseUrl: '/docs',
        } as d.OutputTargetWww,
      ],
    });
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    outputTarget = config.outputTargets[0] as d.OutputTargetWww;
    const swUrl = generateServiceWorkerUrl(outputTarget, outputTarget.serviceWorker as d.ServiceWorkerConfig);
    expect(swUrl).toBe('/docs/sw.js');
  });

  it('default sw url', () => {
    userConfig = mockConfig({ devMode: false });
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    outputTarget = config.outputTargets[0] as d.OutputTargetWww;
    const swUrl = generateServiceWorkerUrl(outputTarget, outputTarget.serviceWorker as d.ServiceWorkerConfig);
    expect(swUrl).toBe('/sw.js');
  });
});

import type { E2EProcessEnv, EmulateConfig } from '@stencil/core/internal';
import type * as puppeteer from 'puppeteer';

export function setScreenshotEmulateData(userEmulateConfig: EmulateConfig, env: E2EProcessEnv) {
  const screenshotEmulate = {
    userAgent: 'default',
    viewport: {
      width: 800,
      height: 600,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false,
    } as puppeteer.Viewport,
    device: undefined as string | undefined,
  } satisfies EmulateConfig;

  if (typeof userEmulateConfig.device === 'string') {
    try {
      const deviceDescriptors = require(env.__STENCIL_PUPPETEER_MODULE__ + '/DeviceDescriptors');

      const puppeteerEmulateOpts = deviceDescriptors[userEmulateConfig.device] as {
        userAgent: string;
        viewport: puppeteer.Viewport;
      };
      if (!puppeteerEmulateOpts) {
        console.error(`invalid emulate device: ${userEmulateConfig.device}`);
        return;
      }

      screenshotEmulate.device = userEmulateConfig.device;
      screenshotEmulate.userAgent = puppeteerEmulateOpts.userAgent;
      screenshotEmulate.viewport = puppeteerEmulateOpts.viewport;
    } catch (e) {
      console.error('error loading puppeteer DeviceDescriptors', e);
      return;
    }
  }

  if (userEmulateConfig.viewport) {
    if (typeof userEmulateConfig.viewport.width === 'number') {
      screenshotEmulate.viewport.width = userEmulateConfig.viewport.width;
    }

    if (typeof userEmulateConfig.viewport.height === 'number') {
      screenshotEmulate.viewport.height = userEmulateConfig.viewport.height;
    }

    if (typeof userEmulateConfig.viewport.deviceScaleFactor === 'number') {
      screenshotEmulate.viewport.deviceScaleFactor = userEmulateConfig.viewport.deviceScaleFactor;
    }

    if (typeof userEmulateConfig.viewport.hasTouch === 'boolean') {
      screenshotEmulate.viewport.hasTouch = userEmulateConfig.viewport.hasTouch;
    }

    if (typeof userEmulateConfig.viewport.isLandscape === 'boolean') {
      screenshotEmulate.viewport.isLandscape = userEmulateConfig.viewport.isLandscape;
    }

    if (typeof userEmulateConfig.viewport.isMobile === 'boolean') {
      screenshotEmulate.viewport.isMobile = userEmulateConfig.viewport.isMobile;
    }

    if (typeof userEmulateConfig.userAgent === 'string') {
      screenshotEmulate.userAgent = userEmulateConfig.userAgent;
    }
  }

  env.__STENCIL_EMULATE__ = JSON.stringify(screenshotEmulate);
}

import { createPuppeteerScreenshotOptions } from '../puppeteer-screenshot';

describe('Puppeteer Screenshot', () => {
  describe('createPuppeteerScreenshotOptions', () => {
    it('should use the viewport width and height by default', () => {
      const options = createPuppeteerScreenshotOptions({}, 800, 600);

      expect(options.clip).toEqual({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      });
    });

    it('should use clip options if provided', () => {
      const options = createPuppeteerScreenshotOptions(
        {
          clip: {
            x: 10,
            y: 20,
            width: 100,
            height: 200,
          },
        },
        800,
        600,
      );

      expect(options.clip).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 200,
      });
    });
  });
});

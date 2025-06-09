import { render } from '@wdio/browser-runner/stencil';

describe('es5 $addClass svg', () => {
  beforeEach(() => {
    render({
      template: () => <es5-addclass-svg></es5-addclass-svg>,
    });
  });

  it('should add a class', async () => {
    const svg = await browser.waitUntil(async () =>
      document.querySelector('es5-addclass-svg').shadowRoot.querySelector('svg'),
    );
    expect(svg.getAttribute('class')).toContain('existing-css-class');
    expect(svg.getAttribute('class')).not.toContain('sc-es5-addclass-svg');
  });
});

import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { expect } from '@wdio/globals';

describe('form associated prop check', function () {
  beforeEach(async () => {
    render({
      components: [],
      template: () => (
        <section>
          <style>{`
            body { font-family: Arial, sans-serif; padding: 20px; }
            .demo-section { margin: 20px 0; padding: 20px; border: 2px solid #ddd; border-radius: 8px; }
            .expected { background-color: #e8f5e8; border-color: #4caf50; }
            .actual { background-color: #fff3e0; border-color: #ff9800; }
            .problem { background-color: #ffebee; border-color: #f44336; }
          `}</style>
          <h1>StencilJS FormAssociated Disabled Bug Demo</h1>

          <div class="demo-section expected">
            <h2>✅ Expected Behavior (disabled=true)</h2>
            <p>This component should be disabled and not emit click events.</p>
            <form-associated-prop-check disabled="true" first="Disabled" last="Component"></form-associated-prop-check>
          </div>

          <div class="demo-section problem">
            <h2>❌ Problem (disabled=false)</h2>
            <p>
              <strong>BUG:</strong> This component should NOT be disabled, but because it's form-associated, the
              presence of the disabled attribute (even with value='false') disables it according to HTML standards.
            </p>
            <form-associated-prop-check
              disabled="false"
              first="Should Not Be"
              last="Disabled"
            ></form-associated-prop-check>
          </div>
        </section>
      ),
    });
  });

  it('should determine that both are components are disabled', async () => {
    const components = document.querySelectorAll('form-associated-prop-check');
    expect(components[0].disabled).toBe(true);
    expect(components[1].disabled).toBe(true);

    await expect(components[0].shadowRoot.querySelector('p')).toHaveText('Disabled prop value: true');
    await expect(components[1].shadowRoot.querySelector('p')).toHaveText('Disabled prop value: true');
  });
});

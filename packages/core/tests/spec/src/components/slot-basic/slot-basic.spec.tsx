import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-basic', () => {
  it('button click rerenders with stable slot content', async () => {
    const { root, waitForChanges } = await render(<slot-basic-root />);

    async function testValues(inc: number) {
      expect(root.querySelector('.inc')).toHaveTextContent('Rendered: ' + inc);

      // results1: text + text
      expect(root.querySelector('.results1 article')).toHaveTextContent('AB');

      // results2: text + span
      expect(root.querySelector('.results2 article')).toHaveTextContent('AB');
      expect(root.querySelector('.results2 article span')).toHaveTextContent('B');

      // results3: text + div
      expect(root.querySelector('.results3 article')).toHaveTextContent('AB');
      expect(root.querySelector('.results3 article div')).toHaveTextContent('B');

      // results4: footer containing text + div
      expect(root.querySelector('.results4 article footer')).toHaveTextContent('AB');
      expect(root.querySelector('.results4 article footer div')).toHaveTextContent('B');

      // results5: span + text
      expect(root.querySelector('.results5 article')).toHaveTextContent('AB');
      expect(root.querySelector('.results5 article span')).toHaveTextContent('A');

      // results6: span + span
      expect(root.querySelector('.results6 article')).toHaveTextContent('AB');
      const results6Spans = root.querySelectorAll('.results6 article span');
      expect(results6Spans[0]).toHaveTextContent('A');
      expect(results6Spans[1]).toHaveTextContent('B');

      // results7: span + div
      expect(root.querySelector('.results7 article')).toHaveTextContent('AB');
      expect(root.querySelector('.results7 article span')).toHaveTextContent('A');
      expect(root.querySelector('.results7 article div')).toHaveTextContent('B');

      // results8: div + text
      expect(root.querySelector('.results8 article')).toHaveTextContent('AB');
      expect(root.querySelector('.results8 article div')).toHaveTextContent('A');

      // results9: div + span
      expect(root.querySelector('.results9 article')).toHaveTextContent('AB');
      expect(root.querySelector('.results9 article div')).toHaveTextContent('A');
      expect(root.querySelector('.results9 article span')).toHaveTextContent('B');

      // results10: div + div
      expect(root.querySelector('.results10 article')).toHaveTextContent('AB');
      const results10Divs = root.querySelectorAll('.results10 article div');
      expect(results10Divs[0]).toHaveTextContent('A');
      expect(results10Divs[1]).toHaveTextContent('B');

      // results11: div + footer(div) + div
      expect(root.querySelector('.results11 article')).toHaveTextContent('ABC');
      const results11Divs = root.querySelectorAll('.results11 article div');
      expect(results11Divs[0]).toHaveTextContent('A');
      expect(results11Divs[1]).toHaveTextContent('B');
      expect(results11Divs[2]).toHaveTextContent('C');
      expect(root.querySelector('.results11 article footer')).toHaveTextContent('B');
    }

    // Test initial render
    await testValues(1);

    // Click and test re-render
    root.querySelector('button')!.click();
    await waitForChanges();
    await testValues(2);

    // Click again and test
    root.querySelector('button')!.click();
    await waitForChanges();
    await testValues(3);
  });
});

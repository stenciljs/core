import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('scoped-slot-text', () => {
  it('sets the textContent in the slot location', async () => {
    const { root } = await render(<cmp-label>This text should go in a slot</cmp-label>);
    await waitForExist('cmp-label.hydrated');

    root.textContent = 'New text to go in the slot';
    expect(root.textContent.trim()).toBe('New text to go in the slot');
  });

  it('leaves the structure of the label intact', async () => {
    const { root } = await render(<cmp-label>This text should go in a slot</cmp-label>);
    await waitForExist('cmp-label.hydrated');

    root.textContent = 'New text for label structure testing';
    const label = root.querySelector('label')!;

    /**
     * Expect two child nodes in the label
     * - a content reference text node
     * - the slotted text node
     */
    expect(label).toBeTruthy();
    expect(label.childNodes.length).toBe(2);
    expect((label.childNodes[0] as any)['s-cr']).toBeDefined();
    expect(label.childNodes[1].textContent).toBe('New text for label structure testing');
  });

  it('sets text, never parsed as HTML', async () => {
    const { root } = await render(<cmp-label>This text should go in a slot</cmp-label>);
    await waitForExist('cmp-label.hydrated');

    root.textContent = '<i id="injected">x</i>';
    expect(root.querySelector('#injected')).toBeNull();
    expect(root.textContent).toBe('<i id="injected">x</i>');
    expect(root.querySelector('label')!.textContent).toBe('<i id="injected">x</i>');
  });

  it('clears the slotted content when set to an empty string', async () => {
    const { root } = await render(<cmp-label>This text should go in a slot</cmp-label>);
    await waitForExist('cmp-label.hydrated');

    root.textContent = '';
    expect(root.textContent).toBe('');
    expect(root.querySelector('label')).toBeTruthy();
  });

  it('ignores slotted comments when read, like the native getter', async () => {
    const { root } = await render(<cmp-label>This text should go in a slot</cmp-label>);
    await waitForExist('cmp-label.hydrated');

    // frameworks put marker comments between adjacent text (React `<!-- -->`, Solid `<!--$-->`)
    root.textContent = 'Rendered by ';
    root.appendChild(document.createComment('$'));
    root.appendChild(document.createTextNode('Solid'));
    expect(root.textContent).toBe('Rendered by Solid');
  });
});

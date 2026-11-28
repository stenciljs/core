import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-fallback', () => {
  it('renders fallback', async () => {
    const { waitForChanges } = await render(<slot-fallback-root></slot-fallback-root>);

    // show fallback content
    expect(
      document.querySelector('.results1 slot-fb[name="start"]:not([hidden])')!.textContent,
    ).toBe('slot start fallback 0');
    expect(document.querySelector('.results1 section slot-fb:not([hidden])')!.textContent).toBe(
      'slot default fallback 0',
    );
    expect(
      document.querySelector('.results1 article span slot-fb[name="end"]:not([hidden])')!
        .textContent,
    ).toBe('slot end fallback 0');

    // update fallback content
    (document.querySelector('button.change-fallback-content') as HTMLButtonElement).click();
    await waitForChanges();

    expect(
      document.querySelector('.results1 slot-fb[name="start"]:not([hidden])')!.textContent,
    ).toBe('slot start fallback 1');
    expect(document.querySelector('.results1 section slot-fb:not([hidden])')!.textContent).toBe(
      'slot default fallback 1',
    );
    expect(
      document.querySelector('.results1 article span slot-fb[name="end"]:not([hidden])')!
        .textContent,
    ).toBe('slot end fallback 1');

    // set light dom instead and hide fallback content
    (document.querySelector('button.change-light-dom') as HTMLButtonElement).click();
    await waitForChanges();

    // fallback content hidden but still the same
    expect(
      document.body.querySelector('.results1 slot-fb[name="start"][hidden]')!.textContent!.trim(),
    ).toBe('slot start fallback 1');
    expect(
      document.body.querySelector('.results1 section slot-fb[hidden]')!.textContent!.trim(),
    ).toBe('slot default fallback 1');
    expect(
      document.body
        .querySelector('.results1 article span slot-fb[name="end"][hidden]')!
        .textContent!.trim(),
    ).toBe('slot end fallback 1');

    // light dom content rendered
    expect(document.querySelector('.results1 content-start')!.textContent).toBe(
      'slot light dom 0 : start',
    );
    expect(document.querySelector('.results1 section content-default')!.textContent).toBe(
      'slot light dom 0 : default',
    );
    expect(document.querySelector('.results1 article span content-end')!.textContent).toBe(
      'slot light dom 0 : end',
    );

    (document.querySelector('button.change-fallback-content') as HTMLButtonElement).click();
    (document.querySelector('button.change-slot-content') as HTMLButtonElement).click();
    await waitForChanges();

    // fallback content hidden and updated content
    expect(
      document.querySelector('.results1 slot-fb[name="start"][hidden]')!.textContent!.trim(),
    ).toBe('slot start fallback 2');
    expect(document.querySelector('.results1 section slot-fb[hidden]')!.textContent!.trim()).toBe(
      'slot default fallback 2',
    );
    expect(
      document
        .querySelector('.results1 article span slot-fb[name="end"][hidden]')!
        .textContent!.trim(),
    ).toBe('slot end fallback 2');

    // light dom content updated
    expect(document.querySelector('.results1 content-start')!.textContent).toBe(
      'slot light dom 1 : start',
    );
    expect(document.querySelector('.results1 section content-default')!.textContent).toBe(
      'slot light dom 1 : default',
    );
    expect(document.querySelector('.results1 article span content-end')!.textContent).toBe(
      'slot light dom 1 : end',
    );

    // change back to fallback content
    (document.querySelector('button.change-light-dom') as HTMLButtonElement).click();
    await waitForChanges();

    // fallback content should not be hidden
    expect(
      document.querySelector('.results1 slot-fb[name="start"]:not([hidden])')!.textContent,
    ).toBe('slot start fallback 2');
    expect(document.querySelector('.results1 section slot-fb:not([hidden])')!.textContent).toBe(
      'slot default fallback 2',
    );
    expect(
      document.querySelector('.results1 article span slot-fb[name="end"]:not([hidden])')!
        .textContent,
    ).toBe('slot end fallback 2');

    // light dom content should not exist
    expect(document.querySelector('.results1 content-start')).toBeNull();
    expect(document.querySelector('.results1 section content-default')).toBeNull();
    expect(document.querySelector('.results1 article span content-end')).toBeNull();
  });

  it('should have correct display style on slot-fb element', async () => {
    await render(<slot-fallback-root></slot-fallback-root>);

    const slotFbElements = document.body.querySelectorAll<HTMLElement>(
      'slot-fallback-root slot-fallback slot-fb',
    );
    slotFbElements.forEach((slotFb) => expect(getComputedStyle(slotFb).display).toBe('contents'));
  });

  it('should hide slot-fb elements when slotted content exists', async () => {
    const { waitForChanges } = await render(<slot-fallback-root></slot-fallback-root>);

    // Show slotted content
    (document.querySelector('button.change-light-dom') as HTMLButtonElement).click();
    await waitForChanges();

    const slotFbElements = document.body.querySelectorAll<HTMLElement>(
      'slot-fallback-root slot-fallback slot-fb',
    );
    slotFbElements.forEach((slotFb) => expect(getComputedStyle(slotFb).display).toBe('none'));
  });
});

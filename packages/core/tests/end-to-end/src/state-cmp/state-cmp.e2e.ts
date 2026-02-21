import { newE2EPage } from '@stencil/core/testing';

describe('@State', () => {
  it('should render all weekdays', async () => {
    const page = await newE2EPage({
      html: `
      <state-cmp></state-cmp>
    `,
    });

    const label = await page.find('state-cmp >>> label');
    expect(label).toEqualHtml('<label>What is your favorite day?</label>');

    const buttons = await page.findAll('state-cmp >>> button');
    expect(buttons).toHaveLength(7);
    expect(buttons[0]).toEqualText('Sunday');
    expect(buttons[1]).toEqualText('Monday');
    expect(buttons[2]).toEqualText('Tuesday');
    expect(buttons[3]).toEqualText('Wednesday');
    expect(buttons[4]).toEqualText('Thursday');
    expect(buttons[5]).toEqualText('Friday');
    expect(buttons[6]).toEqualText('Saturday');
    expect(buttons[6]).not.toEqualText('Sunday');
  });

  it('should select a day and check computed styles', async () => {
    const page = await newE2EPage({
      html: `
      <state-cmp></state-cmp>
    `,
    });

    const buttons = await page.findAll('state-cmp >>> button');
    await buttons[6].click();

    expect(buttons[6]).toHaveClass('selected');

    const selectedStyle = await buttons[6].getComputedStyle();
    expect(selectedStyle.fontWeight).toBe('700');
    expect(selectedStyle.getPropertyValue('font-weight')).toBe('700');
    expect(selectedStyle.color).toBe('rgb(0, 0, 255)');
    expect(selectedStyle.getPropertyValue('color')).toBe('rgb(0, 0, 255)');

    expect(buttons[1]).not.toHaveClass('selected');

    const unselectedStyle = await buttons[1].getComputedStyle();
    expect(unselectedStyle.fontWeight).not.toBe('700');
    expect(unselectedStyle.color).toBe('rgb(0, 0, 0)');
  });
});

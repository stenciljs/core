import { E2EElement, E2EPage, newE2EPage } from '@stencil/core/testing';

import { CarData } from './car-data';

describe('car-list', () => {
  let page: E2EPage;
  let elm: E2EElement;

  beforeEach(async () => {
    page = await newE2EPage({
      html: `
      <car-list></car-list>
    `,
    });
    elm = await page.find('car-list');
  });

  it('should work without parameters', async () => {
    expect(elm).toEqualHtml(`
      <car-list custom-hydrate-flag="">
        <mock:shadow-root></mock:shadow-root>
      </car-list>
    `);

    expect(elm.innerHTML).toEqualHtml(``);
    expect(elm.shadowRoot).toEqualHtml(``);
  });

  it('should set car list data', async () => {
    const cars: CarData[] = [
      new CarData('Cord', 'Model 812', 1934),
      new CarData('Duesenberg', 'SSJ', 1935),
      new CarData('Alfa Romeo', '2900 8c', 1938),
    ];

    elm.setProperty('cars', cars);

    await page.waitForChanges();

    expect(elm).toEqualHtml(`
      <car-list custom-hydrate-flag="">
        <mock:shadow-root>
          <ul>
            <li class="">
              <car-detail custom-hydrate-flag="">
                <section>
                  1934 Cord Model 812
                </section>
              </car-detail>
            </li>
            <li class="">
              <car-detail custom-hydrate-flag="">
                <section>
                  1935 Duesenberg SSJ
                </section>
              </car-detail>
            </li>
            <li class="">
              <car-detail custom-hydrate-flag="">
                <section>
                  1938 Alfa Romeo 2900 8c
                </section>
              </car-detail>
            </li>
          </ul>
        </mock:shadow-root>
      </car-list>
    `);

    expect(elm.innerHTML).toEqualHtml(``);

    expect(elm.shadowRoot).toEqualHtml(`
      <ul>
        <li>
          <car-detail custom-hydrate-flag="">
            <section>
              1934 Cord Model 812
            </section>
          </car-detail>
        </li>
        <li>
          <car-detail custom-hydrate-flag="">
            <section>
              1935 Duesenberg SSJ
            </section>
          </car-detail>
        </li>
        <li>
          <car-detail custom-hydrate-flag="">
            <section>
              1938 Alfa Romeo 2900 8c
            </section>
          </car-detail>
        </li>
      </ul>
    `);
  });
});

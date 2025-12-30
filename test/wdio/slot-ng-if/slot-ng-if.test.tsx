import './assets/angular.min.js';

import { setupIFrameTest } from '../util.js';

describe('slot-ng-if', () => {
  let iframe: HTMLElement;
  before(async () => {
    iframe = await setupIFrameTest('/slot-ng-if/index.html');
  });

  it('renders bound values in slots within ng-if context', async () => {
    const root = iframe.querySelector('slot-ng-if');
    expect(root.textContent).toBe('Angular Bound Label');
  });
});

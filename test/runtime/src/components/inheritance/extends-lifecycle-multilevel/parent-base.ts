import { GrandparentBase } from './grandparent-base.js';

/**
 * ParentBase - middle level of the inheritance chain.
 * Overrides lifecycle methods to call super() and add own tracking.
 */
export class ParentBase extends GrandparentBase {
  componentWillLoad(): void {
    super.componentWillLoad();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentWillLoad');
  }

  componentDidLoad(): void {
    super.componentDidLoad();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentDidLoad');
  }

  componentWillRender(): void {
    super.componentWillRender();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentWillRender');
  }

  componentDidRender(): void {
    super.componentDidRender();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentDidRender');
  }

  componentWillUpdate(): void {
    super.componentWillUpdate();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentWillUpdate');
  }

  componentDidUpdate(): void {
    super.componentDidUpdate();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentDidUpdate');
  }
}

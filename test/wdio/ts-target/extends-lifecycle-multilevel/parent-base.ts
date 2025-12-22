import { GrandparentBase } from './grandparent-base.js';

export class ParentBase extends GrandparentBase {
  // Override lifecycle methods to call super() and add our own tracking
  componentWillLoad() {
    super.componentWillLoad();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentWillLoad');
  }

  componentDidLoad() {
    super.componentDidLoad();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentDidLoad');
  }

  componentWillRender() {
    super.componentWillRender();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentWillRender');
  }

  componentDidRender() {
    super.componentDidRender();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentDidRender');
  }

  componentWillUpdate() {
    super.componentWillUpdate();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentWillUpdate');
  }

  componentDidUpdate() {
    super.componentDidUpdate();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('ParentBase.componentDidUpdate');
  }
}

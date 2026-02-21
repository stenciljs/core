export class GrandparentBase {
  // Lifecycle methods at the top level of inheritance
  componentWillLoad() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentWillLoad');
  }

  componentDidLoad() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentDidLoad');
  }

  componentWillRender() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentWillRender');
  }

  componentDidRender() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentDidRender');
  }

  componentWillUpdate() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentWillUpdate');
  }

  componentDidUpdate() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentDidUpdate');
  }
}

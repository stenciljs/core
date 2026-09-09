/**
 * GrandparentBase - top level of the inheritance chain.
 * Defines lifecycle methods that track calls to window.lifecycleCalls.
 */
export class GrandparentBase {
  componentWillLoad(): void {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentWillLoad');
  }

  componentDidLoad(): void {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentDidLoad');
  }

  componentWillRender(): void {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentWillRender');
  }

  componentDidRender(): void {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentDidRender');
  }

  componentWillUpdate(): void {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentWillUpdate');
  }

  componentDidUpdate(): void {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('GrandparentBase.componentDidUpdate');
  }
}

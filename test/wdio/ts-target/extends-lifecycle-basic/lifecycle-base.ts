export class LifecycleBase {
  // Lifecycle methods that will be inherited - track to global array (no render loops)
  componentWillLoad() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('componentWillLoad');
  }

  componentDidLoad() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('componentDidLoad');
  }

  componentWillRender() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('componentWillRender');
  }

  componentDidRender() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('componentDidRender');
  }

  componentWillUpdate() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('componentWillUpdate');
  }

  componentDidUpdate() {
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('componentDidUpdate');
  }

}

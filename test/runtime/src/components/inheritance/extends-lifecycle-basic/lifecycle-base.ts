declare global {
  interface Window {
    lifecycleCalls?: string[];
  }
}

export class LifecycleBase {
  componentWillLoad() {
    window.lifecycleCalls = window.lifecycleCalls || [];
    window.lifecycleCalls.push('componentWillLoad');
  }

  componentDidLoad() {
    window.lifecycleCalls = window.lifecycleCalls || [];
    window.lifecycleCalls.push('componentDidLoad');
  }

  componentWillRender() {
    window.lifecycleCalls = window.lifecycleCalls || [];
    window.lifecycleCalls.push('componentWillRender');
  }

  componentDidRender() {
    window.lifecycleCalls = window.lifecycleCalls || [];
    window.lifecycleCalls.push('componentDidRender');
  }

  componentWillUpdate() {
    window.lifecycleCalls = window.lifecycleCalls || [];
    window.lifecycleCalls.push('componentWillUpdate');
  }

  componentDidUpdate() {
    window.lifecycleCalls = window.lifecycleCalls || [];
    window.lifecycleCalls.push('componentDidUpdate');
  }
}

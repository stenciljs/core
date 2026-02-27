import { H, f as forceUpdate, t as transformTag, p as proxyCustomElement, h, a as Host } from './index.js';

const ReactiveControllerHost = class extends H {
    constructor() {
        super(false);
    }
    controllers = new Set();
    addController(controller) {
        this.controllers.add(controller);
    }
    removeController(controller) {
        this.controllers.delete(controller);
    }
    requestUpdate() {
        forceUpdate(this);
    }
    connectedCallback() {
        this.controllers.forEach((controller) => controller.hostConnected?.());
    }
    disconnectedCallback() {
        this.controllers.forEach((controller) => controller.hostDisconnected?.());
    }
    componentWillLoad() {
        this.controllers.forEach((controller) => controller.hostWillLoad?.());
    }
    componentDidLoad() {
        this.controllers.forEach((controller) => controller.hostDidLoad?.());
    }
    componentWillRender() {
        this.controllers.forEach((controller) => controller.hostWillRender?.());
    }
    componentDidRender() {
        this.controllers.forEach((controller) => controller.hostDidRender?.());
    }
    componentWillUpdate() {
        this.controllers.forEach((controller) => controller.hostWillUpdate?.());
    }
    componentDidUpdate() {
        this.controllers.forEach((controller) => controller.hostDidUpdate?.());
    }
};

class MouseController {
    constructor(host) {
        this.host = host;
        host.addController(this);
    }
    host;
    pos = { x: 0, y: 0 };
    // Test hooks to verify lifecycle methods were called
    _hostConnectedCalled = false;
    _hostDisconnectedCalled = false;
    _onMouseMove = ({ clientX, clientY }) => {
        this.pos = { x: clientX, y: clientY };
        this.host.requestUpdate();
    };
    hostConnected() {
        this._hostConnectedCalled = true;
        // Store in window for test verification
        window.__mouseControllerConnected = true;
        window.addEventListener('mousemove', this._onMouseMove);
    }
    hostDisconnected() {
        this._hostDisconnectedCalled = true;
        // Store in window for test verification (component may be removed from DOM)
        window.__mouseControllerDisconnected = true;
        window.removeEventListener('mousemove', this._onMouseMove);
    }
}

const MyComponent = /*@__PURE__*/ proxyCustomElement(class MyComponent extends ReactiveControllerHost {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    mouse = new MouseController(this);
    // Track lifecycle calls for testing
    lifecycleCalls = [];
    componentWillLoad() {
        super.componentWillLoad(); // Call base class to trigger controllers
        this.lifecycleCalls = [...this.lifecycleCalls, 'componentWillLoad'];
    }
    componentDidLoad() {
        super.componentDidLoad(); // Call base class to trigger controllers
        this.lifecycleCalls = [...this.lifecycleCalls, 'componentDidLoad'];
    }
    render() {
        return (h(Host, { key: '1618d7b002de745d219ccddb94cb8dce34f60730' }, h("h3", { key: 'c3c155f5e9325931b76caf5256a668a9a3ba80ac' }, "The mouse is at:"), h("pre", { key: '2feeb9fc80223748d5a1dd48a29f5edf14425535', class: "mouse-position" }, "x: ", this.mouse.pos.x, "y: ", this.mouse.pos.y), h("div", { key: 'fea4cd90d9a56a1febd20bb40d7674a41e51dd04', class: "lifecycle-info", style: { display: 'none' } }, "Lifecycle calls: ", this.lifecycleCalls.join(', '))));
    }
    static get style() { return `.sc-extends-via-host-cmp-h {
      display: block;
    }`; }
}, [514, "extends-via-host-cmp", {
        "lifecycleCalls": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-via-host-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-via-host-cmp":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), MyComponent);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsViaHostCmp = MyComponent;
const defineCustomElement = defineCustomElement$1;

export { ExtendsViaHostCmp, defineCustomElement };
//# sourceMappingURL=extends-via-host-cmp.js.map

//# sourceMappingURL=extends-via-host-cmp.js.map
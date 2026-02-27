import { H, f as forceUpdate, p as proxyCustomElement, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const ReactiveControllerHost = class extends H {
    constructor() {
        super(false);
        this.controllers = new Set();
    }
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
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostConnected) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    disconnectedCallback() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostDisconnected) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentWillLoad() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostWillLoad) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentDidLoad() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostDidLoad) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentWillRender() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostWillRender) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentDidRender() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostDidRender) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentWillUpdate() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostWillUpdate) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentDidUpdate() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostDidUpdate) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
};

class MouseController {
    constructor(host) {
        this.pos = { x: 0, y: 0 };
        // Test hooks to verify lifecycle methods were called
        this._hostConnectedCalled = false;
        this._hostDisconnectedCalled = false;
        this._onMouseMove = ({ clientX, clientY }) => {
            this.pos = { x: clientX, y: clientY };
            this.host.requestUpdate();
        };
        this.host = host;
        host.addController(this);
    }
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
        this.mouse = new MouseController(this);
        // Track lifecycle calls for testing
        this.lifecycleCalls = [];
    }
    componentWillLoad() {
        super.componentWillLoad(); // Call base class to trigger controllers
        this.lifecycleCalls = [...this.lifecycleCalls, 'componentWillLoad'];
    }
    componentDidLoad() {
        super.componentDidLoad(); // Call base class to trigger controllers
        this.lifecycleCalls = [...this.lifecycleCalls, 'componentDidLoad'];
    }
    render() {
        return (h(Host, { key: '3aee805025f144744bc77743be33d4dc6b07123a' }, h("h3", { key: 'c92ecada763062cd3cfbeeecabde01335e31adc7' }, "The mouse is at:"), h("pre", { key: '53cb972831a4b341290d18faade9fc052bb5d5ef', class: "mouse-position" }, "x: ", this.mouse.pos.x, "y: ", this.mouse.pos.y), h("div", { key: '2953714b60d4d8f5fd6e3e0a9c6370c3c9d8b3e1', class: "lifecycle-info", style: { display: 'none' } }, "Lifecycle calls: ", this.lifecycleCalls.join(', '))));
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyComponent);
            }
            break;
    } });
}

const ExtendsViaHostCmp = MyComponent;
const defineCustomElement = defineCustomElement$1;

export { ExtendsViaHostCmp, defineCustomElement };

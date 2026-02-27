import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const ClockControllerBase = class extends H {
    constructor() {
        super(false);
        this.timerInterval = 1000;
    }
    // Lifecycle methods that components can use
    componentDidLoad() {
        this.startClock();
    }
    disconnectedCallback() {
        this.stopClock();
    }
    // Controller methods - can be called by host component
    startClock() {
        if (this.timer)
            return; // Already running
        this.timer = setInterval(() => {
            // This simulates Lit's this.host.requestUpdate()
            // Controller tells host "please update yourself"
            this.requestUpdate();
        }, this.timerInterval);
    }
    stopClock() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
    // Utility method for host to get current time
    getCurrentTimeValue() {
        return new Date().toLocaleTimeString();
    }
};

const ControllerUpdatesCmp = /*@__PURE__*/ proxyCustomElement(class ControllerUpdatesCmp extends ClockControllerBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        // Component owns the @State - not the base class
        this.currentTime = new Date().toLocaleTimeString();
        this.isClockRunning = true;
    }
    // Component implements the requestUpdate method (simulates Lit's this.host.requestUpdate())
    requestUpdate() {
        // Controller calls this method to request a re-render
        // Component updates its own @State which triggers re-render
        this.currentTime = this.getCurrentTimeValue();
    }
    toggleClock() {
        if (this.isClockRunning) {
            this.stopClock();
            this.isClockRunning = false;
        }
        else {
            this.startClock();
            this.isClockRunning = true;
        }
    }
    render() {
        return (h("div", { key: '9f16d8b12eb9d97f78f12af9cb130595341f8d6e' }, h("h2", { key: '270b4f8e934fde7378f0908cc2a32c789b1dc89d' }, "Controller-Initiated Updates Test"), h("div", { key: 'f4f97d21ec2fdacb65603d9a1529e9f0a69a38d9', class: "clock-section" }, h("h3", { key: '26fb056fdb38ac60f545dd3b040ff7aa5b02db43' }, "Clock Controller (requestUpdate Pattern)"), h("p", { key: 'd4f566bdbb5dbc0df2860c8a7468eb1c33f40026', class: "current-time" }, "Current Time: ", this.currentTime), h("button", { key: '119c37461093140c3318412520907e1ce592a621', class: "toggle-clock", onClick: () => this.toggleClock() }, this.isClockRunning ? 'Stop Clock' : 'Start Clock')), h("div", { key: '637e91cc101238102b5b5aa30b30aed43f28360b', class: "status-info" }, h("h3", { key: 'f9fbccc8e1b84f51c279c0c66dc0c59a24bbf5ea' }, "How It Works"), h("p", { key: '1c3887ff065728200cd8919d5b201f32ebc69f8d', class: "clock-status" }, "Clock Running: ", this.isClockRunning ? 'Yes' : 'No'), h("p", { key: '0cfc2cadb7eb11523da692d91162c070db5de255', class: "update-info" }, "Base class calls requestUpdate() \u2192 Component updates @State \u2192 Re-render"), h("p", { key: 'f78cf2d18e3e798fbe987c3e5c51a8e975a22457', class: "inheritance-info" }, "Simulates Lit's this.host.requestUpdate() pattern"), h("p", { key: '37d8323a2771ff038908a50cc390c449baabd463', class: "pattern-info" }, "@State lives on component, controller requests updates"))));
    }
}, [512, "extends-controller-updates", {
        "currentTime": [32],
        "isClockRunning": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-controller-updates"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-controller-updates":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ControllerUpdatesCmp);
            }
            break;
    } });
}

const ExtendsControllerUpdates = ControllerUpdatesCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsControllerUpdates, defineCustomElement };

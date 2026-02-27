import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const ClockControllerBase = class extends H {
    timer;
    timerInterval;
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
    // Component owns the @State - not the base class
    currentTime = new Date().toLocaleTimeString();
    isClockRunning = true;
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
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
        return (h("div", { key: 'fa5b914a0fb65f42121ba7b4730473cb91c0e68a' }, h("h2", { key: '15b8eba030e18ad127812076d38f89ec06a6c644' }, "Controller-Initiated Updates Test"), h("div", { key: 'b11130b6a3bd214e5795377c2f35aabf2ed9e817', class: "clock-section" }, h("h3", { key: '98818e373eac5c7869a0ac98e35c36b3f631e360' }, "Clock Controller (requestUpdate Pattern)"), h("p", { key: 'abd39b552a107c11ddd5ccae51edcfae1e2529d6', class: "current-time" }, "Current Time: ", this.currentTime), h("button", { key: '8f35f34665589e38549b724c29a83677d6b7a22a', class: "toggle-clock", onClick: () => this.toggleClock() }, this.isClockRunning ? 'Stop Clock' : 'Start Clock')), h("div", { key: '48ed648b074fd6905ff77a9c32d3cc41872ecd98', class: "status-info" }, h("h3", { key: 'ff082239df1a1eb2fb4d181ef02927d56393cef3' }, "How It Works"), h("p", { key: '77ca48860c57e99ccecb997790fab755e63c05a5', class: "clock-status" }, "Clock Running: ", this.isClockRunning ? 'Yes' : 'No'), h("p", { key: '5865f4302f0c738589e9b0ae50685cffd5ffeb67', class: "update-info" }, "Base class calls requestUpdate() \u2192 Component updates @State \u2192 Re-render"), h("p", { key: 'db8c0dc4f3323c98f4e022012386101a2104cfff', class: "inheritance-info" }, "Simulates Lit's this.host.requestUpdate() pattern"), h("p", { key: '4841d8e14ff0c26536365d12bd6a1694f12bbec9', class: "pattern-info" }, "@State lives on component, controller requests updates"))));
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), ControllerUpdatesCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsControllerUpdates = ControllerUpdatesCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsControllerUpdates, defineCustomElement };
//# sourceMappingURL=extends-controller-updates.js.map

//# sourceMappingURL=extends-controller-updates.js.map
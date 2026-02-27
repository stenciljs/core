import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const ClockBase = class extends H {
    constructor() {
        super(false);
    }
    currentTime = new Date().toLocaleTimeString();
    isClockRunning = true;
    timer;
    timerInterval = 1000;
    // Lifecycle methods
    componentDidLoad() {
        this.startClock();
    }
    disconnectedCallback() {
        this.stopClock();
    }
    // Clock control methods
    startClock() {
        if (this.timer)
            return; // Already running
        this.timer = setInterval(() => {
            // Direct state update - triggers re-render automatically
            // No requestUpdate() needed!
            this.currentTime = new Date().toLocaleTimeString();
        }, this.timerInterval);
    }
    stopClock() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
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
};

const DirectStateCmp = /*@__PURE__*/ proxyCustomElement(class DirectStateCmp extends ClockBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    // Compare with Lit pattern:
    // Lit: private clock = new ClockController(this, 100);
    // Stencil: Just extend the base class - that's it!
    // No controller instance needed
    // No host reference needed
    // No manual requestUpdate() calls needed
    render() {
        return (h("div", { key: 'a4fb2112421c95620f7359ed9137e5a6484439b1' }, h("h2", { key: '33ad573533a2e4af468f68fd99097b72b71dfd7f' }, "Direct State Management Test"), h("div", { key: '475a145715ba7499d310a4849c3cef000a249328', class: "clock-section" }, h("h3", { key: 'febcda14554d28c87121ae2c921f29ad52999939' }, "Clock Controller (Direct State Pattern)"), h("p", { key: '5e456c44aaeec2844c94e6f40b7d338e925fe66d', class: "current-time" }, "Current Time: ", this.currentTime), h("button", { key: 'a684d77e5ca37a5bf88c5496049323ebbd74bebb', class: "toggle-clock", onClick: () => this.toggleClock() }, this.isClockRunning ? 'Stop Clock' : 'Start Clock')), h("div", { key: 'a6d04ec125fe4e6e687b08f0a4a0d4af6cb9f50a', class: "status-info" }, h("h3", { key: 'd074263839994fb92fa368a78168272f1f29779e' }, "How It Works"), h("p", { key: '46e7a49b1ff4907140e1c7fedb9bed509150d084', class: "clock-status" }, "Clock Running: ", this.isClockRunning ? 'Yes' : 'No'), h("p", { key: '0cff4bced6b932d427ee5ca88d3b8639309dafac', class: "update-info" }, "Base class updates @State directly \u2192 Automatic re-render"), h("p", { key: '7a93c8fb34b8ae28dc598e995da3c4f8bbd92b0e', class: "inheritance-info" }, "Leverages Stencil's superior extends functionality"), h("p", { key: '9a9915b8551c6608d6b1c8f3f476686b2d6a859e', class: "pattern-info" }, "@State lives on base class, no requestUpdate needed")), h("div", { key: '1cec88069547cebc1341ba4de12c69052966bfdc', class: "comparison-info" }, h("h3", { key: '2882f73b4965f0aba5c75a8b222dd68fbed2fdca' }, "Comparison with Lit's ReactiveController Pattern"), h("p", { key: 'e5b6a1e8b116ad456452ec2b97b7606a9ae772ea', class: "simpler-info" }, "\u2705 No ReactiveController interface to implement"), h("p", { key: '070cdafa47f4b9b8566ec99d4d76d5518065e222', class: "direct-info" }, "\u2705 No host reference needed in constructor"), h("p", { key: '5ba08f0f93a61db69f3ecb796a4c5f2064c6f79b', class: "cleaner-info" }, "\u2705 No host.requestUpdate() calls needed"), h("p", { key: '05ca9c1fb804054b9339ac2db97f9cee4d63a095', class: "stencil-info" }, "\u2705 No controller instance creation on component"), h("p", { key: 'bbe57c1e9c603ce1d9e5d8323271b7142152977b', class: "extends-info" }, "\u2705 Just extend the base class and inherit @State directly")), h("div", { key: '8c2cf2089230c5f378877a7c11635f8ba3c4e934', class: "lit-vs-stencil" }, h("h3", { key: '862f902008b67d1124f10e2dde1aee8fd248000e' }, "Lit vs Stencil Code Comparison"), h("p", { key: 'f9f043334e5c7ed3760962cf539e715bd0e57eeb', class: "lit-pattern" }, "Lit: private clock = new ClockController(this, 100);"), h("p", { key: '9d05c64490ebacbf53bffd22f70da4c503e4a800', class: "stencil-pattern" }, "Stencil: extends ClockBase // Just extend!"), h("p", { key: '529ed48e881473c67368fcab26e4fbb0810914a3', class: "lit-render" }, "Lit: html`Time: $", '${this.clock.value}', "`"), h("p", { key: '4f590d858ca9a37b4198772afb1595624c43988a', class: "stencil-render" }, "Stencil: <p>Time: ", '{this.currentTime}', "</p>"))));
    }
}, [512, "extends-direct-state", {
        "currentTime": [32],
        "isClockRunning": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-direct-state"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-direct-state":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), DirectStateCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsDirectState = DirectStateCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsDirectState, defineCustomElement };
//# sourceMappingURL=extends-direct-state.js.map

//# sourceMappingURL=extends-direct-state.js.map
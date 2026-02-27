import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const ClockBase = class extends H {
    constructor() {
        super(false);
        this.currentTime = new Date().toLocaleTimeString();
        this.isClockRunning = true;
        this.timerInterval = 1000;
    }
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
        return (h("div", { key: '1425a880655e2b95e1231c50b43ce169f0839567' }, h("h2", { key: '3b28f66353b88f87ea6e97a71ff9a98ca7f51bde' }, "Direct State Management Test"), h("div", { key: 'd4cc3fb0744a154225773bb1b36c27117c6a5f7c', class: "clock-section" }, h("h3", { key: 'd3c3b3079f41a771b3c3f13081aac43bfab97868' }, "Clock Controller (Direct State Pattern)"), h("p", { key: '99fd3273c257919e832cada367e130e317dd0f98', class: "current-time" }, "Current Time: ", this.currentTime), h("button", { key: '65ab363b24a0294f0eb84a1b873f57308b20d37b', class: "toggle-clock", onClick: () => this.toggleClock() }, this.isClockRunning ? 'Stop Clock' : 'Start Clock')), h("div", { key: '07de64a90337ab8620acb76fd3e102f5e03984b4', class: "status-info" }, h("h3", { key: 'a09a643f7fc7f6b895cb99d84c4c89307256bfb6' }, "How It Works"), h("p", { key: '307635ebd7092f7ca79421c602821141ff63a121', class: "clock-status" }, "Clock Running: ", this.isClockRunning ? 'Yes' : 'No'), h("p", { key: '8c5071796906af8932df1313ab038a43861b7dc5', class: "update-info" }, "Base class updates @State directly \u2192 Automatic re-render"), h("p", { key: '2516ce1d6f74cbe54f114b811d05b2f2f35b8597', class: "inheritance-info" }, "Leverages Stencil's superior extends functionality"), h("p", { key: 'cbe74b014e25c19cc7e58eb62df9e185a05aeb52', class: "pattern-info" }, "@State lives on base class, no requestUpdate needed")), h("div", { key: 'b7d02ee0fa584ff6b1d539f523a1c2eadfc0cfc8', class: "comparison-info" }, h("h3", { key: '4aae6785b9e8d0d566d0150dd65fef7213ccd7df' }, "Comparison with Lit's ReactiveController Pattern"), h("p", { key: '9f34dadb9fd0ee55edaf269e0ae26d10c6f0c948', class: "simpler-info" }, "\u2705 No ReactiveController interface to implement"), h("p", { key: '1a984ac38522b0d1040af069aeee1de5043bab88', class: "direct-info" }, "\u2705 No host reference needed in constructor"), h("p", { key: 'b08ce8f8deac45c7bb67b02567645f0ca26d8893', class: "cleaner-info" }, "\u2705 No host.requestUpdate() calls needed"), h("p", { key: '0709341cd59b9bb6ac4001605334e12c7713e146', class: "stencil-info" }, "\u2705 No controller instance creation on component"), h("p", { key: '26e0770d8da35dc1194bcbf62b137bacaa63f0cf', class: "extends-info" }, "\u2705 Just extend the base class and inherit @State directly")), h("div", { key: 'd599e732ade03311c91ba8c8ff23f125699ca65d', class: "lit-vs-stencil" }, h("h3", { key: '492a85d5bf62c906e90025bad8790a8827d54f19' }, "Lit vs Stencil Code Comparison"), h("p", { key: '6d74e00ea53b10c99063f6abdc650c254ecd25f2', class: "lit-pattern" }, "Lit: private clock = new ClockController(this, 100);"), h("p", { key: 'e3871d437876cf596b8ef5b6c05a7787f1d7e81e', class: "stencil-pattern" }, "Stencil: extends ClockBase // Just extend!"), h("p", { key: '54e3810e7e7f97ad0b37fab415b185fe3f737e39', class: "lit-render" }, "Lit: html`Time: $", '${this.clock.value}', "`"), h("p", { key: '23b5aba989e16c33f29bb7fca815a08632ebfb20', class: "stencil-render" }, "Stencil: <p>Time: ", '{this.currentTime}', "</p>"))));
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DirectStateCmp);
            }
            break;
    } });
}

const ExtendsDirectState = DirectStateCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsDirectState, defineCustomElement };

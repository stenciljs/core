import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const WatchBase = class extends H {
    constructor() {
        super(false);
        // Base properties with watch decorators
        this.baseProp = 'base prop initial';
        this.baseCount = 0;
        this.baseState = 'base state initial';
        this.baseCounter = 0;
        // Properties used for reactive chains (watch handlers trigger changes to these)
        this.baseChainTriggered = false;
        this.baseChainCount = 0;
        // Track watch handler execution for testing
        this.baseWatchLog = [];
        this.baseWatchCallCount = 0;
        // Property that can be watched by both base and child (override scenario)
        this.overrideProp = 'override prop initial';
    }
    // Watch baseProp - inherited by child, can be overridden
    basePropChanged(newValue, oldValue) {
        this.baseWatchLog.push(`basePropChanged:${oldValue}->${newValue}`);
        this.baseWatchCallCount++;
        // Reactive chain: trigger change to baseState
        this.baseState = `state updated by baseProp: ${newValue}`;
    }
    // Watch baseCount - inherited by child
    baseCountChanged(newValue, oldValue) {
        this.baseWatchLog.push(`baseCountChanged:${oldValue}->${newValue}`);
        this.baseWatchCallCount++;
        // Reactive chain: increment baseChainCount
        this.baseChainCount = newValue * 2;
    }
    // Watch baseState - inherited by child, can be overridden
    baseStateChanged(newValue, oldValue) {
        this.baseWatchLog.push(`baseStateChanged:${oldValue}->${newValue}`);
        this.baseWatchCallCount++;
    }
    // Watch baseCounter - inherited by child
    baseCounterChanged(newValue, oldValue) {
        this.baseWatchLog.push(`baseCounterChanged:${oldValue}->${newValue}`);
        this.baseWatchCallCount++;
        // Reactive chain: set baseChainTriggered flag
        if (newValue > 0) {
            this.baseChainTriggered = true;
        }
    }
    // Watch overrideProp - can be overridden in child class
    overridePropChanged(newValue, oldValue) {
        this.baseWatchLog.push(`overridePropChanged:base:${oldValue}->${newValue}`);
        this.baseWatchCallCount++;
    }
    // Helper method to get watch log
    getWatchLog() {
        return [...this.baseWatchLog];
    }
    // Helper method to reset watch tracking
    resetWatchLog() {
        this.baseWatchLog = [];
        this.baseWatchCallCount = 0;
        this.baseChainTriggered = false;
        this.baseChainCount = 0;
    }
};

const WatchCmp = /*@__PURE__*/ proxyCustomElement(class WatchCmp extends WatchBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        // Child-specific properties with watch decorators
        this.childProp = 'child prop initial';
        this.childState = 'child state initial';
        this.childCounter = 0;
        // Track child watch handler execution
        this.childWatchLog = [];
        this.childWatchCallCount = 0;
        // Additional reactive chain property
        this.childChainTriggered = false;
    }
    // Watch childProp - child-specific watch handler
    childPropChanged(newValue, oldValue) {
        this.childWatchLog.push(`childPropChanged:${oldValue}->${newValue}`);
        this.childWatchCallCount++;
        // Reactive chain: update childState
        this.childState = `state updated by childProp: ${newValue}`;
    }
    // Watch childState - child-specific watch handler
    childStateChanged(newValue, oldValue) {
        this.childWatchLog.push(`childStateChanged:${oldValue}->${newValue}`);
        this.childWatchCallCount++;
    }
    // Watch childCounter - child-specific watch handler
    childCounterChanged(newValue, oldValue) {
        this.childWatchLog.push(`childCounterChanged:${oldValue}->${newValue}`);
        this.childWatchCallCount++;
        // Reactive chain: trigger childChainTriggered
        if (newValue > 0) {
            this.childChainTriggered = true;
        }
    }
    // Override base watch handler - child version takes precedence
    overridePropChanged(newValue, oldValue) {
        this.childWatchLog.push(`overridePropChanged:child:${oldValue}->${newValue}`);
        this.childWatchCallCount++;
        // Note: base handler should NOT be called - this is override behavior
    }
    // Also watch baseProp in child (multiple @Watch decorators for same property at different levels)
    childBasePropChanged(newValue, oldValue) {
        this.childWatchLog.push(`childBasePropChanged:${oldValue}->${newValue}`);
        this.childWatchCallCount++;
        // This should execute AFTER base handler (execution order test)
    }
    // Methods to trigger property changes for testing
    async updateBaseProp(value) {
        this.baseProp = value;
    }
    async updateBaseCount(value) {
        this.baseCount = value;
    }
    async updateBaseState(value) {
        this.baseState = value;
    }
    async updateBaseCounter(value) {
        this.baseCounter = value;
    }
    async updateOverrideProp(value) {
        this.overrideProp = value;
    }
    async updateChildProp(value) {
        this.childProp = value;
    }
    async updateChildCounter(value) {
        this.childCounter = value;
    }
    async incrementBaseCount() {
        this.baseCount++;
    }
    async incrementBaseCounter() {
        this.baseCounter++;
    }
    async incrementChildCounter() {
        this.childCounter++;
    }
    // Expose base class methods for testing
    getBaseWatchLog() {
        return super.getWatchLog();
    }
    // Get combined watch log
    getCombinedWatchLog() {
        return [...this.baseWatchLog, ...this.childWatchLog];
    }
    // Reset all watch tracking
    async resetWatchLogs() {
        super.resetWatchLog();
        this.childWatchLog = [];
        this.childWatchCallCount = 0;
        this.childChainTriggered = false;
    }
    render() {
        const combinedLog = this.getCombinedWatchLog();
        const totalWatchCalls = this.baseWatchCallCount + this.childWatchCallCount;
        return (h("div", { key: '92b3959dbd8b7bc1eac6318b52c08d4dc13225fd' }, h("h2", { key: '6d29d9d16c4e71510ba9caedf0807c839ebd9307' }, "Watch Decorator Inheritance Test"), h("div", { key: '79cc54855e6544b4f888caf49c7e58a955ba0040', class: "watch-info" }, h("p", { key: '50e71a60eb937edc74f3f00bfac1d4b81469d1cc', class: "base-watch-count" }, "Base Watch Calls: ", this.baseWatchCallCount), h("p", { key: 'ca604046b7f561a9ac46649aa3bbf2bedc0eed72', class: "child-watch-count" }, "Child Watch Calls: ", this.childWatchCallCount), h("p", { key: 'c416845bff6a68c5e79b99d70764a774f989fc91', class: "total-watch-count" }, "Total Watch Calls: ", totalWatchCalls), h("p", { key: '40b35b55a43bb0d31ac287cf28aa7eff0cc53fdf', class: "watch-log-length" }, "Watch Log Entries: ", combinedLog.length)), h("div", { key: '4abdd2b5b076ab3197a06f725d802cd6004508cf', class: "property-values" }, h("h3", { key: '3def0940d1d7ebcd6a0701f06c5475e00fca83b6' }, "Property Values:"), h("p", { key: '08cf1bf544094335f07924a03b87c5c450108b41', class: "base-prop-value" }, "Base Prop: ", this.baseProp), h("p", { key: '0093ecb1990321654ec09cf9ab2b43c7d227942b', class: "base-count-value" }, "Base Count: ", this.baseCount), h("p", { key: 'db74f16beb82a6c255187025d14e5a06cfff344e', class: "base-state-value" }, "Base State: ", this.baseState), h("p", { key: '1890faf2e7f921b95710e54bb04a64ef57d29da7', class: "base-counter-value" }, "Base Counter: ", this.baseCounter), h("p", { key: '8b5baa763f02c8f3adb425ab5ac9a86ced962c7e', class: "override-prop-value" }, "Override Prop: ", this.overrideProp), h("p", { key: '9e6b2f3dd8304a6039a799309a189da7928743a6', class: "child-prop-value" }, "Child Prop: ", this.childProp), h("p", { key: 'b784fcd971e75a56b25a331655e8bb46448f605f', class: "child-state-value" }, "Child State: ", this.childState), h("p", { key: 'f5d0faf0249773533caad8fbf7ca180f621cd5e9', class: "child-counter-value" }, "Child Counter: ", this.childCounter)), h("div", { key: 'dd8d9e356a30cff26189de0fd6130caa0a1670a0', class: "reactive-chains" }, h("h3", { key: '39f8b4d9498812001bad6647a5fbf52740dc48a0' }, "Reactive Chains:"), h("p", { key: 'c43ed1f738cdbcc605abb119a1d7b2de7ad00445', class: "base-chain-triggered" }, "Base Chain Triggered: ", this.baseChainTriggered ? 'true' : 'false'), h("p", { key: 'ecf40dbb48d632cce3a8deb77e20e4e3203cb7c7', class: "base-chain-count" }, "Base Chain Count: ", this.baseChainCount), h("p", { key: '231cf4559553da5239def41a7af8b587556a995f', class: "child-chain-triggered" }, "Child Chain Triggered: ", this.childChainTriggered ? 'true' : 'false')), h("div", { key: '2e86c4882195304728d4e52fd51eb1785176960d', class: "watch-log" }, h("h3", { key: '2c8dcb1736c07a693f9024de774fcb7443cfbc91' }, "Watch Log:"), h("ul", { key: 'bc66eedc1c1b29155abc5aebf9007161af58c230', id: "watch-log-list" }, combinedLog.map((entry, index) => (h("li", { key: index }, entry))))), h("div", { key: '9ed1556f3208d3aa716232798d60215fe5b9a285', class: "controls" }, h("h3", { key: 'c9e964df033b153f404b7cfa6382a582fc481778' }, "Trigger Property Changes:"), h("button", { key: 'd65ec54e2f3b73f2cbce7a6e7115c4adcb701b10', class: "update-base-prop", onClick: () => this.updateBaseProp('base prop updated') }, "Update Base Prop"), h("button", { key: '20b9eb3f025d23ca2cc654aea3c9c05fdc9181f2', class: "update-base-count", onClick: () => this.updateBaseCount(5) }, "Update Base Count"), h("button", { key: '05afff242e6828d08971d7983acb45e5bf2769be', class: "update-base-state", onClick: () => this.updateBaseState('base state updated') }, "Update Base State"), h("button", { key: 'f5174f3c2d14ce493754ab1ac1a5891528cc6a8e', class: "update-base-counter", onClick: () => this.updateBaseCounter(10) }, "Update Base Counter"), h("button", { key: '9e1bc9a9d60314b8216b1161b2e5f53cf64fd4b5', class: "update-override-prop", onClick: () => this.updateOverrideProp('override prop updated') }, "Update Override Prop"), h("button", { key: 'e1d82081f26b7088125ae25d6762859cd7305eb8', class: "update-child-prop", onClick: () => this.updateChildProp('child prop updated') }, "Update Child Prop"), h("button", { key: '9974438a58d5b8cf013d548507a5b5ca852eee06', class: "update-child-counter", onClick: () => this.updateChildCounter(20) }, "Update Child Counter"), h("button", { key: '67193af9681fab8ec63bf28a1bff3a61da3c6b4b', class: "increment-base-count", onClick: () => this.incrementBaseCount() }, "Increment Base Count"), h("button", { key: 'bab2a424c9d56bd8ecae39529950bd446496fa3d', class: "increment-base-counter", onClick: () => this.incrementBaseCounter() }, "Increment Base Counter"), h("button", { key: '3d8117744ad444eecc8957616e7e0c2f0640edff', class: "increment-child-counter", onClick: () => this.incrementChildCounter() }, "Increment Child Counter"), h("button", { key: '78b4c5b5edd0912ec8dfe0ead85436792fca85c4', class: "reset-logs", onClick: () => this.resetWatchLogs() }, "Reset Logs")), h("div", { key: 'bacda21caa3d11ec9df12c1a248fc7a6ed2fdf45', class: "test-info" }, h("p", { key: 'eabed410119ed5d25dbce1a9ccb5925b5820408f' }, "Features: @Watch inheritance | Execution order | Reactive chains | Handler override"))));
    }
    get el() { return this; }
    static get watchers() { return {
        "baseProp": [{
                "basePropChanged": 0
            }, {
                "childBasePropChanged": 0
            }],
        "baseCount": [{
                "baseCountChanged": 0
            }],
        "baseState": [{
                "baseStateChanged": 0
            }],
        "baseCounter": [{
                "baseCounterChanged": 0
            }],
        "childProp": [{
                "childPropChanged": 0
            }],
        "childState": [{
                "childStateChanged": 0
            }],
        "childCounter": [{
                "childCounterChanged": 0
            }],
        "overrideProp": [{
                "overridePropChanged": 0
            }]
    }; }
}, [512, "extends-watch", {
        "baseProp": [1, "base-prop"],
        "baseCount": [2, "base-count"],
        "overrideProp": [1, "override-prop"],
        "childProp": [1, "child-prop"],
        "baseState": [32],
        "baseCounter": [32],
        "baseChainTriggered": [32],
        "baseChainCount": [32],
        "baseWatchLog": [32],
        "baseWatchCallCount": [32],
        "childState": [32],
        "childCounter": [32],
        "childWatchLog": [32],
        "childWatchCallCount": [32],
        "childChainTriggered": [32],
        "updateBaseProp": [64],
        "updateBaseCount": [64],
        "updateBaseState": [64],
        "updateBaseCounter": [64],
        "updateOverrideProp": [64],
        "updateChildProp": [64],
        "updateChildCounter": [64],
        "incrementBaseCount": [64],
        "incrementBaseCounter": [64],
        "incrementChildCounter": [64],
        "resetWatchLogs": [64]
    }, undefined, {
        "baseProp": [{
                "basePropChanged": 0
            }, {
                "childBasePropChanged": 0
            }],
        "baseCount": [{
                "baseCountChanged": 0
            }],
        "baseState": [{
                "baseStateChanged": 0
            }],
        "baseCounter": [{
                "baseCounterChanged": 0
            }],
        "childProp": [{
                "childPropChanged": 0
            }],
        "childState": [{
                "childStateChanged": 0
            }],
        "childCounter": [{
                "childCounterChanged": 0
            }],
        "overrideProp": [{
                "overridePropChanged": 0
            }]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-watch"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-watch":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), WatchCmp);
            }
            break;
    } });
}

const ExtendsWatch = WatchCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsWatch, defineCustomElement };

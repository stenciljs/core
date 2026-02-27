import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const WatchBase = class extends H {
    constructor() {
        super(false);
    }
    // Base properties with watch decorators
    baseProp = 'base prop initial';
    baseCount = 0;
    baseState = 'base state initial';
    baseCounter = 0;
    // Properties used for reactive chains (watch handlers trigger changes to these)
    baseChainTriggered = false;
    baseChainCount = 0;
    // Track watch handler execution for testing
    baseWatchLog = [];
    baseWatchCallCount = 0;
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
    // Property that can be watched by both base and child (override scenario)
    overrideProp = 'override prop initial';
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
    }
    get el() { return this; }
    // Child-specific properties with watch decorators
    childProp = 'child prop initial';
    childState = 'child state initial';
    childCounter = 0;
    // Track child watch handler execution
    childWatchLog = [];
    childWatchCallCount = 0;
    // Additional reactive chain property
    childChainTriggered = false;
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
        return (h("div", { key: '2c8dfd4fe127b785198d6456aca60eae2661a9f9' }, h("h2", { key: 'e584a85a5fc6b1f85753f9b3e9a0bbc034c1fdbb' }, "Watch Decorator Inheritance Test"), h("div", { key: 'dece8eb95e479ee58f35820bf920af94f01a5b54', class: "watch-info" }, h("p", { key: '8a7732d678b2ec5295ddbd6ae4235038df37a7e5', class: "base-watch-count" }, "Base Watch Calls: ", this.baseWatchCallCount), h("p", { key: '521c9402668683321194c94bafb3d8b207fa6749', class: "child-watch-count" }, "Child Watch Calls: ", this.childWatchCallCount), h("p", { key: '058bc4735399484e6575fc86f5d60a89553f4176', class: "total-watch-count" }, "Total Watch Calls: ", totalWatchCalls), h("p", { key: 'b666689e4b1424092546fd6fa9d3a14dd04137dd', class: "watch-log-length" }, "Watch Log Entries: ", combinedLog.length)), h("div", { key: '6eb1a58456ce6af31b2e777ed3597865e58c1f6e', class: "property-values" }, h("h3", { key: '47fa8d20634540760c84fe3b87338a24a1f865a3' }, "Property Values:"), h("p", { key: '9541ac3fd11dec2e43d8b1ecd8476d4bdae9f381', class: "base-prop-value" }, "Base Prop: ", this.baseProp), h("p", { key: 'cf81da428cbcb359e71c6479e7dd0f64e6c12a22', class: "base-count-value" }, "Base Count: ", this.baseCount), h("p", { key: '08139e44d04df3fe92706999121d77b2e2ad1a3c', class: "base-state-value" }, "Base State: ", this.baseState), h("p", { key: 'd49896f1f3e31bfb4476b8b9cd297e98cae81c2a', class: "base-counter-value" }, "Base Counter: ", this.baseCounter), h("p", { key: '60e025ec6ab5d069e85f5aa034093faa1f9dea93', class: "override-prop-value" }, "Override Prop: ", this.overrideProp), h("p", { key: '29043ec395e12fb5512a2cd64047204bab1b8833', class: "child-prop-value" }, "Child Prop: ", this.childProp), h("p", { key: 'd94b5ce877eafdd3046c5b715d7ba2f4f07c225d', class: "child-state-value" }, "Child State: ", this.childState), h("p", { key: 'cfda60cd75e5cf7729a893e5f8567b9023260cde', class: "child-counter-value" }, "Child Counter: ", this.childCounter)), h("div", { key: '19d9fdfbbc3816501d78bfe3ce50e050a8d9c1ce', class: "reactive-chains" }, h("h3", { key: '1954bee4e82f3b511159b7ce563d6bebbc6930c4' }, "Reactive Chains:"), h("p", { key: '9f2173299503ed4485131fee7373622cfa762793', class: "base-chain-triggered" }, "Base Chain Triggered: ", this.baseChainTriggered ? 'true' : 'false'), h("p", { key: 'ae9a264152dd84d5d8a18cf6160718b76a3d0e52', class: "base-chain-count" }, "Base Chain Count: ", this.baseChainCount), h("p", { key: 'f8a47f2daf9cd80e6971c7c0eb01c2797def7b4b', class: "child-chain-triggered" }, "Child Chain Triggered: ", this.childChainTriggered ? 'true' : 'false')), h("div", { key: '597ebe9e084bb32f82a906526693d6c14f4bfa4b', class: "watch-log" }, h("h3", { key: '8ebcac06d61ab1e39003c9080897b8ae3f24fa78' }, "Watch Log:"), h("ul", { key: 'e4b5eab4758e9e6ba502360420ab98b3b4499498', id: "watch-log-list" }, combinedLog.map((entry, index) => (h("li", { key: index }, entry))))), h("div", { key: 'dde7ca9443c88025c9950ef11e800817e6af1b1b', class: "controls" }, h("h3", { key: '0869b0f0ab878eb7d12f13e8591abd0638b4dfc2' }, "Trigger Property Changes:"), h("button", { key: '58f939d4d3e1416fe1b2478b7850cc9990863f88', class: "update-base-prop", onClick: () => this.updateBaseProp('base prop updated') }, "Update Base Prop"), h("button", { key: '30bf7909f91b3c9ae06195778ac42086bfade35e', class: "update-base-count", onClick: () => this.updateBaseCount(5) }, "Update Base Count"), h("button", { key: '50757bff7bc05f4a2ed75eb5567669711fb40135', class: "update-base-state", onClick: () => this.updateBaseState('base state updated') }, "Update Base State"), h("button", { key: '19718c081b42eecbca83a66ae47bb4c0cc40207e', class: "update-base-counter", onClick: () => this.updateBaseCounter(10) }, "Update Base Counter"), h("button", { key: '8867ad0956853306c5e1ed2457c05f738269ec88', class: "update-override-prop", onClick: () => this.updateOverrideProp('override prop updated') }, "Update Override Prop"), h("button", { key: '25a50f53704c691c92794e5729a591ab10cb16fd', class: "update-child-prop", onClick: () => this.updateChildProp('child prop updated') }, "Update Child Prop"), h("button", { key: 'ef68023fe7e2dff7a6f900eb4fe31054ed7179ca', class: "update-child-counter", onClick: () => this.updateChildCounter(20) }, "Update Child Counter"), h("button", { key: '76f14e9449708fd077767402b1362eb5d9f48b86', class: "increment-base-count", onClick: () => this.incrementBaseCount() }, "Increment Base Count"), h("button", { key: '564592dd98b498c3d4f8695503d94b4b9b6af46e', class: "increment-base-counter", onClick: () => this.incrementBaseCounter() }, "Increment Base Counter"), h("button", { key: '32aa4514d3223a41324e4f373c16f55d7cde14b8', class: "increment-child-counter", onClick: () => this.incrementChildCounter() }, "Increment Child Counter"), h("button", { key: '85857bce051b0877d1b0f792f4e1773967adbba2', class: "reset-logs", onClick: () => this.resetWatchLogs() }, "Reset Logs")), h("div", { key: '0efe4f4818970b573b08735fe4f5d29ff5c053c3', class: "test-info" }, h("p", { key: 'f5a041f2d7d6955b478b8678e1905344bf64b4eb' }, "Features: @Watch inheritance | Execution order | Reactive chains | Handler override"))));
    }
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), WatchCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsWatch = WatchCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsWatch, defineCustomElement };
//# sourceMappingURL=extends-watch.js.map

//# sourceMappingURL=extends-watch.js.map
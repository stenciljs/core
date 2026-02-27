import { p as proxyCustomElement, e as createEvent, h, t as transformTag, H } from './p-DYdAJnXF.js';

const MixinParent = class extends H {
    constructor() {
        super(false);
        /**
         * Test getter/setter pattern - ensures default value is preserved
         * and not overwritten with undefined during component initialization.
         */
        this._getterProp = 'getter default value';
        this.prop1 = 'ExtendedCmp text';
        this.prop2 = 'ExtendedCmp prop2 text';
        this.state1 = 'ExtendedCmp state text';
        this.state2 = 'ExtendedCmp state2 text';
    }
    get getterProp() {
        return this._getterProp;
    }
    set getterProp(newValue) {
        this._getterProp = newValue;
    }
    prop1Changed(newValue) {
        console.info('extended class handler prop1:', newValue);
    }
    prop2Changed(newValue) {
        console.info('extended class handler prop2:', newValue);
    }
    state1Changed(newValue) {
        console.info('extended class handler state1:', newValue);
    }
    state2Changed(newValue) {
        console.info('extended class handler state2:', newValue);
    }
    async method1() {
        this.prop1 = 'ExtendedCmp method1 called';
    }
    async method2() {
        this.prop1 = 'ExtendedCmp method2 called';
    }
};
const Mixin = class extends MixinParent {
    constructor() {
        this.prop1 = 'ExtendedCmp text';
        super();
    }
    prop1Changed(newValue) {
        console.info('extended class handler prop1:', newValue);
    }
};
const MixinCmp = /*@__PURE__*/ proxyCustomElement(class MixinCmp extends Mixin {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.myEvent = createEvent(this, "myEvent");
        this.prop1 = 'default text';
        this.state1 = 'default state text';
    }
    prop1Changed(newValue) {
        console.info('main class handler prop1:', newValue);
    }
    state1Changed(newValue) {
        console.info('main class handler state1:', newValue);
    }
    async method1() {
        this.myEvent.emit('main class method1 called');
        this.prop1 = 'main class method1 called';
    }
    render() {
        return (h("div", { key: 'd25851d6e3ae3aabd1895ba1f4f9421e1bf3c508' }, h("p", { key: '1a25f3d48051b2e6b733f5de8d96fbeaa7c0123a', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: '3b09127ca1171a3f6ee5b6e3fb0e3b30623cb055', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: '6989fb001d00cb23c9dec90f169bfbe383a0411e', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: 'b1ece0cfb52f280dc17046aa47fd13f38610a9be', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: '66858869f840a4f4bd0e434df870f5e84c4cbe39', class: "main-state-2" }, "Main class state2: ", this.state2)));
    }
    static get watchers() { return {
        "prop2": [{
                "prop2Changed": 0
            }],
        "state2": [{
                "state2Changed": 0
            }],
        "prop1": [{
                "prop1Changed": 0
            }],
        "state1": [{
                "state1Changed": 0
            }]
    }; }
}, [512, "extends-local", {
        "getterProp": [6145, "getter-prop"],
        "prop2": [1, "prop-2"],
        "prop1": [1, "prop-1"],
        "state2": [32],
        "state1": [32],
        "method2": [64],
        "method1": [64]
    }, undefined, {
        "prop2": [{
                "prop2Changed": 0
            }],
        "state2": [{
                "state2Changed": 0
            }],
        "prop1": [{
                "prop1Changed": 0
            }],
        "state1": [{
                "state1Changed": 0
            }]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-local"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-local":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MixinCmp);
            }
            break;
    } });
}

const ExtendsLocal = MixinCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsLocal, defineCustomElement };

import { h, p as proxyCustomElement, M as Mixin, t as transformTag } from './p-DYdAJnXF.js';

const MixinBFactory = (Base) => {
    const MixinB = class extends Base {
        constructor() {
            this.prop3 = 'mixin b text';
            /**
             * Test getter/setter pattern in mixin - ensures default value is preserved
             * and not overwritten with undefined during component initialization.
             */
            this._getterProp = 'getter default value';
            this.state3 = 'mixin b state text';
            super();
        }
        get getterProp() {
            return this._getterProp;
        }
        set getterProp(newValue) {
            this._getterProp = newValue;
        }
        prop3Changed(newValue) {
            console.info('mixin b handler prop3:', newValue);
        }
        state3Changed(newValue) {
            console.info('mixin b handler state3:', newValue);
        }
        async method3() {
            this.prop3 = 'mixin b method3 called';
        }
        render() {
            return (h("div", null, h("p", { class: "mixin-b-prop-1" }, "Another class prop3: ", this.prop3), h("p", { class: "mixin-b-state-1" }, "Another class state3: ", this.state3), h("p", { class: "mixin-b-getter-prop" }, "Mixin getter prop: ", this.getterProp)));
        }
    };
    return MixinB;
};

const MixinAFactory = (Base) => {
    const MixinA = class extends Base {
        constructor() {
            this.prop1 = 'MixinA text';
            this.prop2 = 'ExtendedCmp prop2 text';
            this.state1 = 'ExtendedCmp state text';
            this.state2 = 'ExtendedCmp state2 text';
            super();
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
        render() {
            return (h("div", null, h("p", { class: "extended-prop-1" }, "Base Extended class prop 1: ", this.prop1), h("p", { class: "extended-prop-2" }, "Base Extended class prop 2: ", this.prop2), h("p", { class: "extended-state-1" }, "Base Extended class state 1: ", this.state1), h("p", { class: "extended-state-2" }, "Base Extended class state 2: ", this.state2)));
        }
    };
    return MixinA;
};

const MixinCmp = /*@__PURE__*/ proxyCustomElement(class MixinCmp extends Mixin(MixinAFactory, MixinBFactory) {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
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
        this.prop1 = 'main class method1 called';
    }
    render() {
        return (h("div", { key: 'c10da458c435384e0f7aa3f3c7c6caa347d589bf' }, h("p", { key: 'fbb8ae51c48afc6f8345c18c029a82bb2db85e98', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: '0045757d3e95f4cc3337c0669d48db13e6b65613', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: 'ea87f755c2377cb2f0a0bc242a9948e164350df3', class: "main-prop-3" }, "Main class prop3: ", this.prop3), h("p", { key: '6ea85eca0e8e36ac39e15ab075da6e3d341b261f', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: 'e5054b9480db46d4237dfa29e578a94eeb83b616', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: 'f4ea0e11d0d3b0153d318590f013cb923186e56b', class: "main-state-2" }, "Main class state2: ", this.state2), h("p", { key: '11503ea7d478e63680c2c1831da49d629399002f', class: "main-state-3" }, "Main class state3: ", this.state3)));
    }
    static get watchers() { return {
        "prop3": [{
                "prop3Changed": 0
            }],
        "state3": [{
                "state3Changed": 0
            }],
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
}, [512, "extends-mixin-cmp", {
        "prop3": [1, "prop-3"],
        "getterProp": [6145, "getter-prop"],
        "prop2": [1, "prop-2"],
        "prop1": [1, "prop-1"],
        "state3": [32],
        "state2": [32],
        "state1": [32],
        "method3": [64],
        "method2": [64],
        "method1": [64]
    }, undefined, {
        "prop3": [{
                "prop3Changed": 0
            }],
        "state3": [{
                "state3Changed": 0
            }],
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
    const components = ["extends-mixin-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-mixin-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MixinCmp);
            }
            break;
    } });
}

const ExtendsMixinCmp = MixinCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsMixinCmp, defineCustomElement };

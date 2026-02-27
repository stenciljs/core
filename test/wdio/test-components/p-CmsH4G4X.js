import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ExtendedCmpCmp = /*@__PURE__*/ proxyCustomElement(class ExtendedCmpCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
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
    render() {
        return (h("div", { key: 'd50deeb049508a4ff8480c870e7bd6276ed85965' }, h("p", { key: 'dcdf02b793d3f6e42c91a6d5aa83e6826e763c94', class: "extended-prop-1" }, "Base Extended class prop 1: ", this.prop1), h("p", { key: 'e58a5e6c5bb48847387eb232ccae02d7500e744b', class: "extended-prop-2" }, "Base Extended class prop 2: ", this.prop2), h("p", { key: '26a41968bdd6a128666ffb0bab25aaf42ac91cec', class: "extended-state-1" }, "Base Extended class state 1: ", this.state1), h("p", { key: '89b3bb19da232ddb29a2acd8d13bc50bae7a67b7', class: "extended-state-2" }, "Base Extended class state 2: ", this.state2)));
    }
    static get watchers() { return {
        "prop1": [{
                "prop1Changed": 0
            }],
        "prop2": [{
                "prop2Changed": 0
            }],
        "state1": [{
                "state1Changed": 0
            }],
        "state2": [{
                "state2Changed": 0
            }]
    }; }
}, [0, "extended-cmp-cmp", {
        "getterProp": [6145, "getter-prop"],
        "prop1": [1, "prop-1"],
        "prop2": [1, "prop-2"],
        "state1": [32],
        "state2": [32],
        "method1": [64],
        "method2": [64]
    }, undefined, {
        "prop1": [{
                "prop1Changed": 0
            }],
        "prop2": [{
                "prop2Changed": 0
            }],
        "state1": [{
                "state1Changed": 0
            }],
        "state2": [{
                "state2Changed": 0
            }]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extended-cmp-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "extended-cmp-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ExtendedCmpCmp);
            }
            break;
    } });
}

export { ExtendedCmpCmp as E, defineCustomElement as d };

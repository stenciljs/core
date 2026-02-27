import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SiblingExtendedBase = /*@__PURE__*/ proxyCustomElement(class SiblingExtendedBase extends H {
    constructor(registerHost) {
        /**
         * Test getter/setter pattern - ensures default value is preserved
         * and not overwritten with undefined during component initialization.
         */
        this._getterProp = 'getter default value';
        this.prop1 = 'ExtendedCmp text';
        this.prop2 = 'ExtendedCmp prop2 text';
        this.state1 = 'ExtendedCmp state text';
        this.state2 = 'ExtendedCmp state2 text';
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
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
        return (h("div", { key: '0dfce3070fc3c9c88a684fada69b0315c96715ef' }, h("p", { key: 'a607dba6177742c483c503cb48d6a81cf5368a79', class: "extended-prop-1" }, "Base Extended class prop 1: ", this.prop1), h("p", { key: '2714b9c3db1d971f30a4c0f2e573c3255ae9e3d1', class: "extended-prop-2" }, "Base Extended class prop 2: ", this.prop2), h("p", { key: '54fb1ccb50f424ea02ba1e54b5f405c640564321', class: "extended-state-1" }, "Base Extended class state 1: ", this.state1), h("p", { key: '7370bf4ea475243c261df9bcc8e87ff182091200', class: "extended-state-2" }, "Base Extended class state 2: ", this.state2)));
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
}, [512, "sibling-extended-base", {
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
    const components = ["sibling-extended-base"];
    components.forEach(tagName => { switch (tagName) {
        case "sibling-extended-base":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SiblingExtendedBase);
            }
            break;
    } });
}

export { SiblingExtendedBase as S, defineCustomElement as d };

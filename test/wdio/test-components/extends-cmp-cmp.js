import { p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';
import { E as ExtendedCmp } from './p-DlIL7iq5.js';

const ExtendsCmpCmp$1 = /*@__PURE__*/ proxyCustomElement(class ExtendsCmpCmp extends ExtendedCmp {
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
        return (h("div", { key: '45178c546466e9d13acb6a72f15867711f3e07b4' }, h("p", { key: '1bd21a7aee247dc09e692ec297240eab750320fc', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: '9d5c42e4f2223a802220a83ae1b57e473280a0e0', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: '256dc4536a248144f555a90a57a7f28dae90ece4', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: '07d094e87c1668eaa6316673528945433b68f4fd', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: '5f37e2439bb5051944d97f88851f037cae1092ac', class: "main-state-2" }, "Main class state2: ", this.state2)));
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
}, [512, "extends-cmp-cmp", {
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
    const components = ["extends-cmp-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-cmp-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ExtendsCmpCmp$1);
            }
            break;
    } });
}

const ExtendsCmpCmp = ExtendsCmpCmp$1;
const defineCustomElement = defineCustomElement$1;

export { ExtendsCmpCmp, defineCustomElement };

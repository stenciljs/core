import { t as transformTag, p as proxyCustomElement, c as createEvent, h, H } from './index.js';

const MixinParent = class extends H {
    constructor() {
        super(false);
    }
    myEvent;
    /**
     * Test getter/setter pattern - ensures default value is preserved
     * and not overwritten with undefined during component initialization.
     */
    _getterProp = 'getter default value';
    get getterProp() {
        return this._getterProp;
    }
    set getterProp(newValue) {
        this._getterProp = newValue;
    }
    prop1 = 'ExtendedCmp text';
    prop1Changed(newValue) {
        console.info('extended class handler prop1:', newValue);
    }
    prop2 = 'ExtendedCmp prop2 text';
    prop2Changed(newValue) {
        console.info('extended class handler prop2:', newValue);
    }
    state1 = 'ExtendedCmp state text';
    state1Changed(newValue) {
        console.info('extended class handler state1:', newValue);
    }
    state2 = 'ExtendedCmp state2 text';
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
        super();
    }
    prop1 = 'ExtendedCmp text';
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
    }
    prop1 = 'default text';
    prop1Changed(newValue) {
        console.info('main class handler prop1:', newValue);
    }
    state1 = 'default state text';
    state1Changed(newValue) {
        console.info('main class handler state1:', newValue);
    }
    async method1() {
        this.myEvent.emit('main class method1 called');
        this.prop1 = 'main class method1 called';
    }
    render() {
        return (h("div", { key: 'a31585c9707ed08f90152b5232257e410df2679c' }, h("p", { key: 'ec02d23564b4c843a2056e00eb671e1c531dade0', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: '3d99e1629c108f9a3a63a87239998474e7438ab3', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: '57998796d02cb77ecaa7c8e371c763feb1938902', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: 'f7bb0b9c10eef247c9a67f34db7a8bf5707cc9ee', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: '6867c7ec486a896901f423911c92f594f107b27e', class: "main-state-2" }, "Main class state2: ", this.state2)));
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), MixinCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsLocal = MixinCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsLocal, defineCustomElement };
//# sourceMappingURL=extends-local.js.map

//# sourceMappingURL=extends-local.js.map
import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const PropSerializer$1 = /*@__PURE__*/ proxyCustomElement(class PropSerializer extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.boolStates = [];
        this.jsonStates = [];
        this.arrayStates = [];
        this.getSetOrder = [];
        this._getSet = { moo: 'bar' };
    }
    boolOrSomethingSerialize(newVal) {
        if (newVal === false || newVal === 'false' || newVal === 0 || newVal === '0') {
            return null;
        }
        if (newVal)
            return newVal.toString();
    }
    boolWatcher(newVal) {
        this.boolStates.push(newVal);
    }
    async getBools() {
        return this.boolStates;
    }
    nonReflectSerialize(newVal) {
        // should never be called
        return newVal ? newVal.toString().toUpperCase() : null;
    }
    jsonSerialize(newVal) {
        try {
            return JSON.stringify(newVal);
        }
        catch (e) {
            return null;
        }
    }
    arrayAndJsonWatcher(newVal, _old, propName) {
        if (propName === 'array')
            this.arrayStates.push(newVal);
        if (propName === 'json')
            this.jsonStates.push(newVal);
    }
    async getJson() {
        return this.jsonStates;
    }
    async getArray() {
        return this.arrayStates;
    }
    get getSet() {
        return this._getSet;
    }
    set getSet(v) {
        this.getSetOrder.push('1.', v);
        this._getSet = v;
    }
    getSetSerialize(newVal) {
        this.getSetOrder.push('2.', newVal);
        try {
            return JSON.stringify(newVal);
        }
        catch (e) {
            return null;
        }
    }
    getSetWatcher(newVal) {
        this.getSetOrder.push('3.', newVal);
    }
    async getGetSet() {
        return this.getSetOrder;
    }
    async reset() {
        this.boolStates = [];
        this.jsonStates = [];
        this.arrayStates = [];
        this.getSetOrder = [];
    }
    render() {
        return h("div", { key: '3e17ebaf39ae98dd172b923d65d4885e743f83b5' }, "testing");
    }
    static get watchers() { return {
        "boolOrSomething": [{
                "boolWatcher": 0
            }],
        "array": [{
                "arrayAndJsonWatcher": 0
            }],
        "json": [{
                "arrayAndJsonWatcher": 0
            }],
        "getSet": [{
                "getSetWatcher": 0
            }]
    }; }
    static get serializers() { return {
        "boolOrSomething": [{
                "boolOrSomethingSerialize": 0
            }],
        "nonReflect": [{
                "nonReflectSerialize": 0
            }],
        "json": [{
                "jsonSerialize": 0
            }],
        "array": [{
                "jsonSerialize": 0
            }],
        "getSet": [{
                "getSetSerialize": 0
            }]
    }; }
}, [0, "prop-serializer", {
        "boolOrSomething": [520, "bool-or-something"],
        "nonReflect": [1, "non-reflect"],
        "array": [528],
        "json": [528],
        "getSet": [6672, "get-set"],
        "getBools": [64],
        "getJson": [64],
        "getArray": [64],
        "getGetSet": [64],
        "reset": [64]
    }, undefined, {
        "boolOrSomething": [{
                "boolWatcher": 0
            }],
        "array": [{
                "arrayAndJsonWatcher": 0
            }],
        "json": [{
                "arrayAndJsonWatcher": 0
            }],
        "getSet": [{
                "getSetWatcher": 0
            }]
    }, {
        "boolOrSomething": [{
                "boolOrSomethingSerialize": 0
            }],
        "nonReflect": [{
                "nonReflectSerialize": 0
            }],
        "json": [{
                "jsonSerialize": 0
            }],
        "array": [{
                "jsonSerialize": 0
            }],
        "getSet": [{
                "getSetSerialize": 0
            }]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["prop-serializer"];
    components.forEach(tagName => { switch (tagName) {
        case "prop-serializer":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), PropSerializer$1);
            }
            break;
    } });
}

const PropSerializer = PropSerializer$1;
const defineCustomElement = defineCustomElement$1;

export { PropSerializer, defineCustomElement };

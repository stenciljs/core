import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const AttributeDeserializer$1 = /*@__PURE__*/ proxyCustomElement(class AttributeDeserializer extends H {
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
    boolDeserialze(newVal) {
        if (newVal === null || newVal.match(/^(null|false|undefined)$/))
            return false;
        return true;
    }
    boolWatcher(newVal) {
        this.boolStates.push(newVal);
    }
    async getBools() {
        return this.boolStates;
    }
    jsonDeserialize(newVal) {
        try {
            return JSON.parse(newVal);
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
        this.getSetOrder.push('2.', v);
        this._getSet = v;
    }
    getSetDeserialize(newVal) {
        this.getSetOrder.push('1.', newVal);
        try {
            return JSON.parse(newVal);
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
    render() {
        return h("div", { key: '1898f0bbfa18b0b11e6d43b7c8d6550dd52ed78c' }, "testing");
    }
    static get watchers() { return {
        "bool": [{
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
    static get deserializers() { return {
        "bool": [{
                "boolDeserialze": 0
            }],
        "json": [{
                "jsonDeserialize": 0
            }],
        "array": [{
                "jsonDeserialize": 0
            }],
        "getSet": [{
                "getSetDeserialize": 0
            }]
    }; }
}, [0, "attribute-deserializer", {
        "bool": [4],
        "array": [16],
        "json": [16],
        "getSet": [6160, "get-set"],
        "getBools": [64],
        "getJson": [64],
        "getArray": [64],
        "getGetSet": [64]
    }, undefined, {
        "bool": [{
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
    }, undefined, {
        "bool": [{
                "boolDeserialze": 0
            }],
        "json": [{
                "jsonDeserialize": 0
            }],
        "array": [{
                "jsonDeserialize": 0
            }],
        "getSet": [{
                "getSetDeserialize": 0
            }]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["attribute-deserializer"];
    components.forEach(tagName => { switch (tagName) {
        case "attribute-deserializer":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AttributeDeserializer$1);
            }
            break;
    } });
}

const AttributeDeserializer = AttributeDeserializer$1;
const defineCustomElement = defineCustomElement$1;

export { AttributeDeserializer, defineCustomElement };

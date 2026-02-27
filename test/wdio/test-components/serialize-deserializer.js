import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const PropSerializer = /*@__PURE__*/ proxyCustomElement(class PropSerializer extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.arrayStates = [];
        this.getSetOrder = [];
    }
    async componentWillLoad() {
        return;
    }
    arraySerialize(newVal) {
        return null;
    }
    arrayDeserialize(newVal) {
        try {
            return JSON.parse(newVal);
        }
        catch (e) {
            return null;
        }
    }
    arrayAndJsonWatcher(newVal) {
        this.arrayStates.push(newVal);
    }
    async getArray() {
        return this.arrayStates;
    }
    get getSet() {
        return this._getSet;
    }
    set getSet(v) {
        this.getSetOrder.push('setter.', v);
        this._getSet = v;
    }
    getSetSerialize(newVal) {
        return null;
    }
    getSetDeserialize(newVal) {
        this.getSetOrder.push('deserialize.', newVal);
        try {
            return JSON.parse(newVal);
        }
        catch (e) {
            return null;
        }
    }
    getSetWatcher(newVal) {
        this.getSetOrder.push('watcher.', newVal);
    }
    async getGetSet() {
        return this.getSetOrder;
    }
    async reset() {
        this.arrayStates = [];
        this.getSetOrder = [];
    }
    render() {
        return h("div", { key: 'acca2e3e2d3e9127d43db143a0e44fb4a7b90fdb' }, "testing");
    }
    static get watchers() { return {
        "array": [{
                "arrayAndJsonWatcher": 0
            }],
        "getSet": [{
                "getSetWatcher": 0
            }]
    }; }
    static get serializers() { return {
        "array": [{
                "arraySerialize": 0
            }],
        "getSet": [{
                "getSetSerialize": 0
            }]
    }; }
    static get deserializers() { return {
        "array": [{
                "arrayDeserialize": 0
            }],
        "getSet": [{
                "getSetDeserialize": 0
            }]
    }; }
}, [0, "serialize-deserializer", {
        "array": [528],
        "getSet": [6672, "get-set"],
        "getArray": [64],
        "getGetSet": [64],
        "reset": [64]
    }, undefined, {
        "array": [{
                "arrayAndJsonWatcher": 0
            }],
        "getSet": [{
                "getSetWatcher": 0
            }]
    }, {
        "array": [{
                "arraySerialize": 0
            }],
        "getSet": [{
                "getSetSerialize": 0
            }]
    }, {
        "array": [{
                "arrayDeserialize": 0
            }],
        "getSet": [{
                "getSetDeserialize": 0
            }]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["serialize-deserializer"];
    components.forEach(tagName => { switch (tagName) {
        case "serialize-deserializer":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), PropSerializer);
            }
            break;
    } });
}

const SerializeDeserializer = PropSerializer;
const defineCustomElement = defineCustomElement$1;

export { SerializeDeserializer, defineCustomElement };

import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

var _a, _b;
var Foo;
(function (Foo) {
    // names are explicitly different to ensure we aren't
    // just resolving the declaration name.
    Foo["BAR"] = "first";
})(Foo || (Foo = {}));
const MyProp = 'last';
const ComputedPropertiesWatchDecorator$1 = /*@__PURE__*/ proxyCustomElement(class ComputedPropertiesWatchDecorator extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this[_a] = 'no';
        this[_b] = 'content';
    }
    onFirstNameChange(newVal, oldVal, attrName) {
        this.firstNameCalledWith = {
            newVal,
            oldVal,
            attrName,
        };
    }
    onLastNameChange(newVal, oldVal, attrName) {
        this.lastNameCalledWith = {
            newVal,
            oldVal,
            attrName,
        };
    }
    onFirstNameChangeImmediate(newVal, oldVal, attrName) {
        this.firstNameCalledWithImmediate = {
            newVal,
            oldVal,
            attrName,
        };
    }
    onLastNameChangeImmediate(newVal, oldVal, attrName) {
        this.lastNameCalledWithImmediate = {
            newVal,
            oldVal,
            attrName,
        };
    }
    render() {
        return (h("div", { key: '39f453478320e6b5c799407efa1547faf4ac4c73' }, h("p", { key: '9e2a136f08bc198af55010e9735e99eeca40ba78' }, "First name called with: ", this.firstNameCalledWith ? JSON.stringify(this.firstNameCalledWith) : 'not yet'), h("p", { key: 'f0e56a80e929244e11f872d63e20ebffab5d8e78' }, "Last name called with: ", this.lastNameCalledWith ? JSON.stringify(this.lastNameCalledWith) : 'not yet'), h("p", { key: '5ad4f4cd4fa585121f4d57793916b376b98b5e58' }, "First name called with immediate:", ' ', this.firstNameCalledWithImmediate ? JSON.stringify(this.firstNameCalledWithImmediate) : 'not yet'), h("p", { key: 'd1e1b713566ccf1b1f96a96227e2e404ac5aea59' }, "Last name called with immediate:", ' ', this.lastNameCalledWithImmediate ? JSON.stringify(this.lastNameCalledWithImmediate) : 'not yet')));
    }
    static get watchers() { return {
        "first": [{
                "onFirstNameChange": 0
            }, {
                "onFirstNameChangeImmediate": 1
            }],
        "last": [{
                "onLastNameChange": 0
            }, {
                "onLastNameChangeImmediate": 1
            }]
    }; }
}, [0, "computed-properties-watch-decorator", {
        "first": [1],
        "last": [1]
    }, undefined, {
        "first": [{
                "onFirstNameChange": 0
            }, {
                "onFirstNameChangeImmediate": 1
            }],
        "last": [{
                "onLastNameChange": 0
            }, {
                "onLastNameChangeImmediate": 1
            }]
    }]);
_a = Foo.BAR, _b = MyProp;
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["computed-properties-watch-decorator"];
    components.forEach(tagName => { switch (tagName) {
        case "computed-properties-watch-decorator":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ComputedPropertiesWatchDecorator$1);
            }
            break;
    } });
}

const ComputedPropertiesWatchDecorator = ComputedPropertiesWatchDecorator$1;
const defineCustomElement = defineCustomElement$1;

export { ComputedPropertiesWatchDecorator, defineCustomElement };

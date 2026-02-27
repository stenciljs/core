import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const CustomStatesCmp$1 = /*@__PURE__*/ proxyCustomElement(class CustomStatesCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.internals = this.attachInternals();
        this.internals.states.add("open");
    }
    /**
     * Toggle a custom state on or off
     * @param stateName the name of the state to toggle
     * @param force optional boolean to force the state on (true) or off (false)
     */
    async toggleState(stateName, force) {
        const states = this.internals.states;
        if (force === undefined) {
            // Toggle: if has, delete; if not, add
            if (states.has(stateName)) {
                states.delete(stateName);
            }
            else {
                states.add(stateName);
            }
        }
        else if (force) {
            states.add(stateName);
        }
        else {
            states.delete(stateName);
        }
    }
    /**
     * Check if a custom state is currently set
     * @param stateName the name of the state to check
     * @returns true if the state is set, false otherwise
     */
    async hasState(stateName) {
        return this.internals.states.has(stateName);
    }
    render() {
        return h("div", { key: 'aa0c514b5086757fe9816a75721a8964a2984f21' }, "Custom States Test");
    }
    static get attachInternalsCustomStates() {
        return [{
                "name": "open",
                "initialValue": true,
                "docs": ""
            }, {
                "name": "active",
                "initialValue": false,
                "docs": ""
            }, {
                "name": "disabled",
                "initialValue": false,
                "docs": ""
            }];
    }
}, [0, "custom-states-cmp", {
        "toggleState": [64],
        "hasState": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-states-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-states-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomStatesCmp$1);
            }
            break;
    } });
}

const CustomStatesCmp = CustomStatesCmp$1;
const defineCustomElement = defineCustomElement$1;

export { CustomStatesCmp, defineCustomElement };

import { p as proxyCustomElement, H, t as transformTag, h } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-YH6-nUrr.js';
import { d as defineCustomElement$2 } from './p-BmCyrFHA.js';

const LifecycleUpdateA$1 = /*@__PURE__*/ proxyCustomElement(class LifecycleUpdateA extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.values = [];
    }
    testClick() {
        this.values.push(this.values.length + 1);
        this.values = this.values.slice();
        const li = document.createElement(transformTag('li'));
        li.innerHTML = `<span style="color:gray">async add child components to lifecycle-update-a</span> ${this.values[this.values.length - 1]}`;
        document.getElementById('output').appendChild(li);
    }
    componentWillLoad() {
        const li = document.createElement(transformTag('li'));
        li.innerHTML = `<span style="color:maroon">lifecycle-update-a</span> <span style="color:blue">componentWillLoad</span>`;
        document.getElementById('output').appendChild(li);
        return new Promise((resolve) => {
            setTimeout(resolve, 10);
        });
    }
    componentDidLoad() {
        const li = document.createElement(transformTag('li'));
        li.innerHTML = `<span style="color:maroon">lifecycle-update-a</span> <span style="color:green">componentDidLoad</span>`;
        document.getElementById('output').appendChild(li);
    }
    componentWillUpdate() {
        const li = document.createElement(transformTag('li'));
        li.innerHTML = `<span style="color:maroon">lifecycle-update-a</span> <span style="color:cyan">componentWillUpdate</span> ${this.values[this.values.length - 1]}`;
        document.getElementById('output').appendChild(li);
    }
    componentDidUpdate() {
        const li = document.createElement(transformTag('li'));
        li.innerHTML = `<span style="color:maroon">lifecycle-update-a</span> <span style="color:limegreen">componentDidUpdate</span> ${this.values[this.values.length - 1]}`;
        document.getElementById('output').appendChild(li);
    }
    render() {
        return (h("div", { key: '05c6a22be2cae99eefef5b57704cc4a23e723288' }, h("button", { key: '65745e3508b778e9e61a18be953ffd1ddcd8e38f', onClick: this.testClick.bind(this), class: "test" }, "Add Child Components"), h("hr", { key: '76e7001f8593e365c8735ffdc55b0d4e18721ff0' }), this.values.map((value) => {
            return h("lifecycle-update-b", { value: value });
        })));
    }
}, [0, "lifecycle-update-a", {
        "values": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-update-a", "lifecycle-update-b", "lifecycle-update-c"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-update-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), LifecycleUpdateA$1);
            }
            break;
        case "lifecycle-update-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "lifecycle-update-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const LifecycleUpdateA = LifecycleUpdateA$1;
const defineCustomElement = defineCustomElement$1;

export { LifecycleUpdateA, defineCustomElement };

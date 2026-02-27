import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ManualSlotTabs$1 = /*@__PURE__*/ proxyCustomElement(class ManualSlotTabs extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.btns = [];
        this.activeTab = 0;
    }
    componentDidLoad() {
        this.updateSlotAssignment();
    }
    async setActiveTab(index) {
        this.activeTab = index;
        this.updateSlotAssignment();
        this.btns.forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });
    }
    updateSlotAssignment() {
        if (!this.activeSlot)
            return;
        const tabs = this.el.querySelectorAll('[slot^="tab-"]');
        const activeTabElement = Array.from(tabs).find((tab) => tab.getAttribute('slot') === `tab-${this.activeTab}`);
        // Manually assign only the active tab to the slot
        if (activeTabElement) {
            this.activeSlot.assign(activeTabElement);
        }
        else {
            this.activeSlot.assign();
        }
    }
    handleTabClick(index) {
        this.setActiveTab(index);
    }
    render() {
        return [
            h("div", { key: 'a5d97b067a370c19f5d2cec4b8db28a016e89f81', class: "tabs" }, h("button", { key: 'd8ff9d53dd4f07c9776929468e68a71fd5ebf620', ref: (el) => (this.btns[0] = el), class: "active", onClick: () => this.handleTabClick(0) }, "Tab 1"), h("button", { key: '66cb469a211896ad374755f65262a835fd1acb33', ref: (el) => (this.btns[1] = el), onClick: () => this.handleTabClick(1) }, "Tab 2"), h("button", { key: 'bcd1870a6e5c38bcb3dbe27391c1bc3e7570258e', ref: (el) => (this.btns[2] = el), onClick: () => this.handleTabClick(2) }, "Tab 3")),
            h("div", { key: '8463ed7142a4129487bea0e9e9d46ba1aae95d5b', class: "content" }, h("slot", { key: '410037092cab5520489842a6abb5ec1a51ac6372', ref: (el) => (this.activeSlot = el) })),
        ];
    }
    static get slotAssignment() { return "manual"; }
    get el() { return this; }
    static get style() { return `:host {
      display: block;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 0;
      font-family: system-ui, sans-serif;
    }

    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid #333;
      background: #f0f0f0;
    }

    .tabs button {
      flex: 1;
      padding: 12px 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .tabs button:hover {
      background: #e0e0e0;
    }

    .tabs button.active {
      background: white;
      color: #0066cc;
      border-bottom: 3px solid #0066cc;
      margin-bottom: -2px;
    }

    .content {
      padding: 20px;
      min-height: 100px;
    }

    .content slot {
      display: block;
    }`; }
}, [1281, "manual-slot-tabs", {
        "setActiveTab": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["manual-slot-tabs"];
    components.forEach(tagName => { switch (tagName) {
        case "manual-slot-tabs":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ManualSlotTabs$1);
            }
            break;
    } });
}

const ManualSlotTabs = ManualSlotTabs$1;
const defineCustomElement = defineCustomElement$1;

export { ManualSlotTabs, defineCustomElement };

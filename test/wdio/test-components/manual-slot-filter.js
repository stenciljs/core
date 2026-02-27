import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ManualSlotFilter$1 = /*@__PURE__*/ proxyCustomElement(class ManualSlotFilter extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.filter = 'all';
    }
    componentDidLoad() {
        this.updateSlotAssignment();
    }
    async setFilter(filter) {
        this.filter = filter;
        this.updateSlotAssignment();
    }
    updateSlotAssignment() {
        if (!this.contentSlot)
            return;
        const items = this.el.querySelectorAll('[data-category]');
        const filtered = Array.from(items).filter((item) => {
            if (this.filter === 'all')
                return true;
            return item.getAttribute('data-category') === this.filter;
        });
        // Manually assign only filtered items to the slot
        this.contentSlot.assign(...filtered);
    }
    handleFilterClick(filter) {
        this.setFilter(filter);
    }
    render() {
        return [
            h("div", { key: '468189e993bf0f776aff82164c10b86ece7cf0d0', class: "controls" }, h("button", { key: '291235f8a35459837d0efecf00475ffb797f0df9', class: this.filter === 'all' ? 'active' : '', onClick: () => this.handleFilterClick('all') }, "All"), h("button", { key: 'a39bd5e9330448edf85ffcd025a404e05466f147', class: this.filter === 'fruit' ? 'active' : '', onClick: () => this.handleFilterClick('fruit') }, "Fruits"), h("button", { key: 'c173802e6ec0014baca62b0aaaf2126a38855936', class: this.filter === 'vegetable' ? 'active' : '', onClick: () => this.handleFilterClick('vegetable') }, "Vegetables")),
            h("div", { key: '6226dd79c646cfadb7b5d0efd3d0e592e82637c5', class: "content" }, h("slot", { key: '31e1d6490bb4b216b83c0ea6f7f53391c901be1c', ref: (el) => (this.contentSlot = el) })),
        ];
    }
    static get slotAssignment() { return "manual"; }
    get el() { return this; }
    static get style() { return `:host {
      display: block;
      padding: 16px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .controls {
      margin-bottom: 16px;
      display: flex;
      gap: 8px;
    }

    button {
      padding: 8px 16px;
      border: 1px solid #0066cc;
      background: white;
      color: #0066cc;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover {
      background: #f0f7ff;
    }

    button.active {
      background: #0066cc;
      color: white;
    }

    .content {
      border-top: 1px solid #eee;
      padding-top: 16px;
    }

    slot {
      display: block;
    }`; }
}, [1281, "manual-slot-filter", {
        "filter": [32],
        "setFilter": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["manual-slot-filter"];
    components.forEach(tagName => { switch (tagName) {
        case "manual-slot-filter":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ManualSlotFilter$1);
            }
            break;
    } });
}

const ManualSlotFilter = ManualSlotFilter$1;
const defineCustomElement = defineCustomElement$1;

export { ManualSlotFilter, defineCustomElement };

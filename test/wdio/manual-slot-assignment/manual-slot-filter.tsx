import { Component, Element, h, Method, State } from '@stencil/core';

/**
 * A filterable list that uses manual slot assignment to show/hide items
 * based on a filter criteria.
 */
@Component({
  tag: 'manual-slot-filter',
  shadow: {
    slotAssignment: 'manual',
  },
  styles: `
    :host {
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
    }
  `,
})
export class ManualSlotFilter {
  @Element() el: HTMLElement;

  @State() filter: string = 'all';

  private contentSlot!: HTMLSlotElement;

  componentDidLoad() {
    this.updateSlotAssignment();
  }

  @Method()
  async setFilter(filter: string) {
    this.filter = filter;
    this.updateSlotAssignment();
  }

  private updateSlotAssignment() {
    if (!this.contentSlot) return;

    const items = this.el.querySelectorAll('[data-category]');
    const filtered = Array.from(items).filter((item) => {
      if (this.filter === 'all') return true;
      return item.getAttribute('data-category') === this.filter;
    });

    // Manually assign only filtered items to the slot
    this.contentSlot.assign(...filtered);
  }

  private handleFilterClick(filter: string) {
    this.setFilter(filter);
  }

  render() {
    return [
      <div class="controls">
        <button class={this.filter === 'all' ? 'active' : ''} onClick={() => this.handleFilterClick('all')}>
          All
        </button>
        <button class={this.filter === 'fruit' ? 'active' : ''} onClick={() => this.handleFilterClick('fruit')}>
          Fruits
        </button>
        <button class={this.filter === 'vegetable' ? 'active' : ''} onClick={() => this.handleFilterClick('vegetable')}>
          Vegetables
        </button>
      </div>,
      <div class="content">
        <slot ref={(el) => (this.contentSlot = el)}></slot>
      </div>,
    ];
  }
}

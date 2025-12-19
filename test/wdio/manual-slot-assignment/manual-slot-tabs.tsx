import { Component, Element, h, Method } from '@stencil/core';

/**
 * A tabbed container that uses manual slot assignment to dynamically
 * assign tab content to the active slot based on user interaction.
 */
@Component({
  tag: 'manual-slot-tabs',
  shadow: {
    slotAssignment: 'manual',
  },
  styles: `
    :host {
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
    }
  `,
})
export class ManualSlotTabs {
  @Element() el: HTMLElement;

  private activeSlot?: HTMLSlotElement;
  private btns: HTMLButtonElement[] = [];
  private activeTab: number = 0;

  componentDidLoad() {
    this.updateSlotAssignment();
  }

  @Method()
  async setActiveTab(index: number) {
    this.activeTab = index;
    this.updateSlotAssignment();
    this.btns.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });
  }

  private updateSlotAssignment() {
    if (!this.activeSlot) return;

    const tabs = this.el.querySelectorAll('[slot^="tab-"]');
    const activeTabElement = Array.from(tabs).find((tab) => tab.getAttribute('slot') === `tab-${this.activeTab}`);

    // Manually assign only the active tab to the slot
    if (activeTabElement) {
      this.activeSlot.assign(activeTabElement);
    } else {
      this.activeSlot.assign();
    }
  }

  private handleTabClick(index: number) {
    this.setActiveTab(index);
  }

  render() {
    return [
      <div class="tabs">
        <button
          ref={(el) => (this.btns[0] = el as HTMLButtonElement)}
          class="active"
          onClick={() => this.handleTabClick(0)}
        >
          Tab 1
        </button>
        <button ref={(el) => (this.btns[1] = el as HTMLButtonElement)} onClick={() => this.handleTabClick(1)}>
          Tab 2
        </button>
        <button ref={(el) => (this.btns[2] = el as HTMLButtonElement)} onClick={() => this.handleTabClick(2)}>
          Tab 3
        </button>
      </div>,
      <div class="content">
        <slot ref={(el) => (this.activeSlot = el)}></slot>
      </div>,
    ];
  }
}

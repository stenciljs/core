import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'template-render',
  shadow: true,
})
export class TemplateRender {
  @State() items: string[] = ['Item 1', 'Item 2', 'Item 3'];

  addItem = () => {
    this.items = [...this.items, `Item ${this.items.length + 1}`];
  };

  render() {
    return (
      <div>
        <h1>Template Element Test</h1>

        {/* Template with simple content */}
        <template id="simple-template">
          <p class="template-content">This is template content</p>
        </template>

        {/* Template with nested elements */}
        <template id="nested-template">
          <div class="container">
            <h2>Nested Template</h2>
            <p>With multiple children</p>
            <span>And different tags</span>
          </div>
        </template>

        {/* Template with dynamic content */}
        <template id="list-template">
          <li class="list-item">
            <span class="item-text">Placeholder</span>
          </li>
        </template>

        {/* Render list using template */}
        <div>
          <button id="add-item" onClick={this.addItem}>
            Add Item
          </button>
          <ul id="item-list">
            {this.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Container for cloned content */}
        <div id="cloned-container"></div>
      </div>
    );
  }
}

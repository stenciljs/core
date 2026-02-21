import { Component, State, h, Method } from '@stencil/core';

interface Row {
  id: number;
  label: string;
}

const adjectives = [
  'pretty',
  'large',
  'big',
  'small',
  'tall',
  'short',
  'long',
  'handsome',
  'plain',
  'quaint',
  'clean',
  'elegant',
  'easy',
  'angry',
  'crazy',
  'helpful',
  'mushy',
  'odd',
  'unsightly',
  'adorable',
  'important',
  'inexpensive',
  'cheap',
  'expensive',
  'fancy',
];
const colours = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange'];
const nouns = [
  'table',
  'chair',
  'house',
  'bbq',
  'desk',
  'car',
  'pony',
  'cookie',
  'sandwich',
  'burger',
  'pizza',
  'mouse',
  'keyboard',
];

let nextId = 1;

function random(max: number): number {
  return Math.round(Math.random() * 1000) % max;
}

function buildData(count: number): Row[] {
  const data: Row[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: nextId++,
      label: `${adjectives[random(adjectives.length)]} ${colours[random(colours.length)]} ${nouns[random(nouns.length)]}`,
    });
  }
  return data;
}

@Component({
  tag: 'perf-rows',
  styles: `
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table td {
      padding: 4px;
      border: 1px solid #ddd;
    }
    .table tr.selected {
      background: #007bff;
      color: white;
    }
    .remove {
      cursor: pointer;
      color: red;
    }
  `,
  shadow: false,
})
export class PerfRows {
  @State() rows: Row[] = [];
  @State() selectedId: number = 0;

  @Method()
  async run(): Promise<void> {
    this.rows = buildData(1000);
  }

  @Method()
  async runLots(): Promise<void> {
    this.rows = buildData(10000);
  }

  @Method()
  async add(): Promise<void> {
    this.rows = [...this.rows, ...buildData(1000)];
  }

  @Method()
  async update(): Promise<void> {
    const newRows = [...this.rows];
    for (let i = 0; i < newRows.length; i += 10) {
      newRows[i] = { ...newRows[i], label: newRows[i].label + ' !!!' };
    }
    this.rows = newRows;
  }

  @Method()
  async clear(): Promise<void> {
    this.rows = [];
  }

  @Method()
  async swapRows(): Promise<void> {
    if (this.rows.length > 998) {
      const newRows = [...this.rows];
      const temp = newRows[1];
      newRows[1] = newRows[998];
      newRows[998] = temp;
      this.rows = newRows;
    }
  }

  @Method()
  async selectRow(id: number): Promise<void> {
    this.selectedId = id;
  }

  @Method()
  async removeRow(id: number): Promise<void> {
    this.rows = this.rows.filter((r) => r.id !== id);
  }

  @Method()
  async getRowCount(): Promise<number> {
    return this.rows.length;
  }

  render() {
    return (
      <div>
        <table class="table">
          <tbody>
            {this.rows.map((row) => (
              <tr key={row.id} class={row.id === this.selectedId ? 'selected' : ''}>
                <td class="id">{row.id}</td>
                <td class="label">{row.label}</td>
                <td>
                  <span class="remove" onClick={() => this.removeRow(row.id)}>
                    x
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

import { Component, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'page-list',
  styleUrl: 'page-list.css',
  shadow: true,
})
export class PatternlibPagination {
  @Prop({ mutable: true }) lastPage: number | null = null;
  @State() pages: Array<number> = [];

  private fillPageArray(start: number, num: number): Array<number> {
    const pages = [];
    for (let i = 0; i < num; i++) {
      pages.push(start + i);
    }
    return pages;
  }

  componentWillLoad(): void {
    // range guard
    this.lastPage = this.lastPage && this.lastPage >= 1 ? this.lastPage : 1;
    this.pages = this.fillPageArray(0, this.lastPage);
  }

  render() {
    return (
      <div>
        <div class="pagination">
          <div class="pagination-pages pagination-notation">
            {this.pages.map((i) => (
              <page-list-item label={i}></page-list-item>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

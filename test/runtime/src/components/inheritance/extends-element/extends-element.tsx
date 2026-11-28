import { Component, State } from "@stencil/core";

import { ElementBase } from "./element-base.js";

@Component({
  tag: "extends-element",
})
export class ExtendsElement extends ElementBase {
  @State() loadedTagName?: string;

  componentWillLoad() {
    this.loadedTagName = this.el?.tagName.toLowerCase();
  }

  render() {
    return (
      <div>
        <p class="base-tag">{this.baseTagName}</p>
        <p class="own-tag">{this.el?.tagName.toLowerCase()}</p>
        <p class="loaded-tag">{this.loadedTagName}</p>
        <p class="label">{this.label}</p>
      </div>
    );
  }
}

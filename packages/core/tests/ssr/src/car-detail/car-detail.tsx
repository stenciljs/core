import { Component, h, Prop, AttrDeserialize } from '@stencil/core';

import { CarData } from '../car-list/car-data';

@Component({
  tag: 'car-detail',
  assetsDirs: ['assets-a'],
})
export class CarDetail {
  @Prop() car: CarData;
  @AttrDeserialize('car')
  parseCars(newValue: string) {
    return JSON.parse(newValue);
  }

  componentWillLoad() {
    return new Promise((resolve) => setTimeout(resolve, 20));
  }

  render() {
    if (!this.car) {
      return null;
    }

    return (
      <section>
        {this.car.year} {this.car.make} {this.car.model}
      </section>
    );
  }
}

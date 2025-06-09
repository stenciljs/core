import { Component, h, Prop } from '@stencil/core';

import { CarData } from '../car-list/car-data';

@Component({
  tag: 'car-detail',
  assetsDirs: ['assets-a'],
})
export class CarDetail {
  @Prop() car: CarData;

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

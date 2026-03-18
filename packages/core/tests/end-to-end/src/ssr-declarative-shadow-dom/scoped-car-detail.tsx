import { Component, h, Prop, AttrDeserialize } from '@stencil/core';

import { CarData } from '../car-list/car-data';

@Component({
  tag: 'scoped-car-detail',
  styleUrl: 'another-car-detail.css',
  scoped: true,
})
export class CarDetail {
  @Prop() car: CarData;
  @AttrDeserialize('car')
  parseCars(newValue: string) {
    return JSON.parse(newValue);
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

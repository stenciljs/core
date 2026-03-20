import { Component, h, Prop, AttrDeserialize } from '@stencil/core';

import { CarData } from '../car-list/car-data';

@Component({
  tag: 'another-car-detail',
  styleUrl: 'another-car-detail.css',
  shadow: true,
})
export class CarDetail {
  @Prop() car: CarData;
  @AttrDeserialize('car')
  parseCars(newValue: string) {
    try {
      return JSON.parse(newValue);
    } catch (error) {
      return newValue;
    }
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

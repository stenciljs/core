import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';

import { CarData } from '../car-list/car-data';

/**
 * Component that helps display a list of cars
 * @slot header - The slot for the header content.
 * @part car - The shadow part to target to style the car.
 */
@Component({
  tag: 'scoped-car-list',
  styleUrl: 'another-car-list.css',
  scoped: true,
})
export class CarList {
  @Prop() cars: CarData[];
  @Prop({ mutable: true }) selected: CarData;
  @Event() carSelected: EventEmitter<CarData>;

  componentWillLoad() {
    return new Promise((resolve) => setTimeout(resolve, 20));
  }

  selectCar(car: CarData) {
    this.selected = car;
    this.carSelected.emit(car);
  }

  render() {
    if (!Array.isArray(this.cars)) {
      return null;
    }

    return (
      <ul>
        {this.cars.map((car) => {
          return (
            <li class={car === this.selected ? 'selected' : ''}>
              <another-car-detail car={car}></another-car-detail>
            </li>
          );
        })}
      </ul>
    );
  }
}

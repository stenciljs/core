import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';

import { CarData } from './car-data';

/**
 * Component that helps display a list of cars
 * @slot header - The slot for the header content.
 * @part car - The shadow part to target to style the car.
 */
@Component({
  tag: 'car-list',
  styleUrl: 'car-list.css',
  shadow: true,
  assetsDirs: ['assets-a'],
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
            <li class={car === this.selected ? 'selected' : ''} onClick={() => this.selectCar(car)}>
              <car-detail car={car}></car-detail>
            </li>
          );
        })}
      </ul>
    );
  }
}

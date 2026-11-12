# component-library

This directory contains a small Stencil library to be consumed by other applications for testing purposes.

The library consists of a single component, `<my-component></my-component>`.
Documentation for using this component can be found in the [README.md file](./src/components/my-component/readme.md) for
the component.

## scripts

This library contains three NPM scripts:

- `build` - builds the project for use in other applications
- `clean` - removes previously created build artifacts
- `start` - starts up a local dev server to validate the component looks/behaves as expected (without having to
consume it in an application)

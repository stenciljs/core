import { Component, h, Prop, Watch } from '@stencil/core';

enum Foo {
  // names are explicitly different to ensure we aren't
  // just resolving the declaration name.
  BAR = 'first',
}

const MyProp = 'last';

@Component({
  tag: 'computed-properties-watch-decorator',
})
export class ComputedPropertiesWatchDecorator {
  @Prop() [Foo.BAR] = 'no';

  @Prop() [MyProp] = 'content';

  firstNameCalledWith: any;
  lastNameCalledWith: any;
  firstNameCalledWithImmediate: any;
  lastNameCalledWithImmediate: any;

  @Watch(Foo.BAR)
  onFirstNameChange(newVal: string, oldVal: string, attrName: string) {
    this.firstNameCalledWith = {
      newVal,
      oldVal,
      attrName,
    };
  }

  @Watch(MyProp)
  onLastNameChange(newVal: string, oldVal: string, attrName: string) {
    this.lastNameCalledWith = {
      newVal,
      oldVal,
      attrName,
    };
  }

  @Watch(Foo.BAR, { immediate: true })
  onFirstNameChangeImmediate(newVal: string, oldVal: string, attrName: string) {
    this.firstNameCalledWithImmediate = {
      newVal,
      oldVal,
      attrName,
    };
  }

  @Watch(MyProp, { immediate: true })
  onLastNameChangeImmediate(newVal: string, oldVal: string, attrName: string) {
    this.lastNameCalledWithImmediate = {
      newVal,
      oldVal,
      attrName,
    };
  }

  render() {
    return (
      <div>
        <p>First name called with: {this.firstNameCalledWith ? JSON.stringify(this.firstNameCalledWith) : 'not yet'}</p>
        <p>Last name called with: {this.lastNameCalledWith ? JSON.stringify(this.lastNameCalledWith) : 'not yet'}</p>
        <p>
          First name called with immediate:{' '}
          {this.firstNameCalledWithImmediate ? JSON.stringify(this.firstNameCalledWithImmediate) : 'not yet'}
        </p>
        <p>
          Last name called with immediate:{' '}
          {this.lastNameCalledWithImmediate ? JSON.stringify(this.lastNameCalledWithImmediate) : 'not yet'}
        </p>
      </div>
    );
  }
}

import { transpileModule } from './transpile';

describe('parse events', () => {
  it('events', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        /**
         * Hello, this is an event
         * @foo bar
         */
        @Event() thingChanged: EventEmitter<string>;
      }
    `);

    expect(t.event).toEqual({
      name: 'thingChanged',
      method: 'thingChanged',
      bubbles: true,
      cancelable: true,
      composed: true,
      internal: false,
      complexType: {
        original: 'string',
        resolved: 'string',
        references: {},
      },
      docs: {
        text: 'Hello, this is an event',
        tags: [
          {
            name: 'foo',
            text: 'bar',
          },
        ],
      },
    });
  });

  it('different options', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Event({
          eventName: 'ionChange',
          bubbles: false,
          cancelable: false,
          composed: false,
        }) thingChanged: EventEmitter<void>;
      }
    `);
    expect(t.event).toEqual({
      name: 'ionChange',
      method: 'thingChanged',
      bubbles: false,
      cancelable: false,
      composed: false,
      internal: false,
      complexType: {
        original: 'void',
        resolved: `void`,
        references: {},
      },
      docs: {
        text: '',
        tags: [],
      },
    });
  });

  it('no type', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        /**
         * Hello, this is an event
         * @foo bar
         */
        @Event() thingChanged: EventEmitter;
      }
    `);
    expect(t.event.complexType).toEqual({
      original: 'any',
      resolved: 'any',
      references: {},
    });
  });

  it('alias type', () => {
    const t = transpileModule(`
      export type Mode = 'md' | 'ios';

      @Component({tag: 'cmp-a'})
      export class CmpA {
        /**
         * Hello, this is an event
         * @foo bar
         */
        @Event() thingChanged: EventEmitter<Mode>;
      }
    `);
    expect(t.event.complexType).toEqual({
      original: 'Mode',
      resolved: `"ios" | "md"`,
      references: {
        Mode: {
          id: 'module.tsx::Mode',
          location: 'local',
          path: 'module.tsx',
        },
      },
    });
  });
});

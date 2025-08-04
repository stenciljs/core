import { transpileModule } from './transpile';

describe('constants support in decorators', () => {
  describe('@Event and @Listen decorator constant resolution', () => {
    it('should work with enum values in @Event decorator', () => {
      const t = transpileModule(`
        enum EventType {
          CUSTOM = 'customEvent'
        }
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: EventType.CUSTOM }) customEvent: EventEmitter<string>;
        }
      `);

      expect(t.event).toEqual({
        name: 'customEvent',
        method: 'customEvent',
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
          text: '',
          tags: [],
        },
      });
    });

    it('should work with const variables in @Event decorator', () => {
      const t = transpileModule(`
        const EVENT_NAME = 'myCustomEvent';
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: EVENT_NAME }) customEvent: EventEmitter<string>;
        }
      `);

      expect(t.event).toEqual({
        name: 'myCustomEvent',
        method: 'customEvent',
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
          text: '',
          tags: [],
        },
      });
    });

    it('should work with nested object constants in @Event decorator', () => {
      const t = transpileModule(`
        const EVENTS = {
          USER: {
            LOGIN: 'userLogin',
            LOGOUT: 'userLogout'
          }
        } as const;
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: EVENTS.USER.LOGIN }) loginEvent: EventEmitter<string>;
        }
      `);

      expect(t.event).toEqual({
        name: 'userLogin',
        method: 'loginEvent',
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
          text: '',
          tags: [],
        },
      });
    });

    it('should work with enum values in @Listen decorator', () => {
      const t = transpileModule(`
        enum EventType {
          CLICK = 'click'
        }
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Listen(EventType.CLICK)
          handleClick() {
            console.log('clicked');
          }
        }
      `);

      expect(t.listeners).toEqual([
        {
          name: 'click',
          method: 'handleClick',
          capture: false,
          passive: false,
          target: undefined,
        },
      ]);
    });

    it('should work with const variables in @Listen decorator', () => {
      const t = transpileModule(`
        const EVENT_NAME = 'customEvent';
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Listen(EVENT_NAME)
          handleEvent() {
            console.log('event handled');
          }
        }
      `);

      expect(t.listeners).toEqual([
        {
          name: 'customEvent',
          method: 'handleEvent',
          capture: false,
          passive: false,
          target: undefined,
        },
      ]);
    });

    it('should work with nested object constants in @Listen decorator', () => {
      const t = transpileModule(`
        const EVENTS = {
          USER: {
            LOGIN: 'userLogin'
          }
        } as const;
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Listen(EVENTS.USER.LOGIN)
          handleLogin() {
            console.log('user logged in');
          }
        }
      `);

      expect(t.listeners).toEqual([
        {
          name: 'userLogin',
          method: 'handleLogin',
          capture: false,
          passive: false,
          target: undefined,
        },
      ]);
    });

    it('should work with computed property constants', () => {
      const t = transpileModule(`
        const EVENTS = { LOGIN: 'computed-login-event' } as const;
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: EVENTS.LOGIN }) loginEvent: EventEmitter<string>;
        }
      `);

      // Should resolve the computed property constant
      expect(t.event.name).toBe('computed-login-event');
      expect(t.cmp).toBeDefined();
    });

    it('should work with deeply nested object constants in @Event decorator', () => {
      const t = transpileModule(`
        const APP_EVENTS = {
          USER: {
            AUTHENTICATION: {
              LOGIN: 'user-auth-login',
              LOGOUT: 'user-auth-logout'
            }
          }
        } as const;
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: APP_EVENTS.USER.AUTHENTICATION.LOGIN }) loginEvent: EventEmitter<string>;
        }
      `);

      expect(t.event).toEqual({
        name: 'user-auth-login',
        method: 'loginEvent',
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
          text: '',
          tags: [],
        },
      });
    });

    it('should work with template literal constants in @Event decorator', () => {
      const t = transpileModule(`
        const PREFIX = 'app';
        const ACTION = 'userLogin';
        const EVENT_NAME = \`\${PREFIX}:\${ACTION}\`;
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: EVENT_NAME }) loginEvent: EventEmitter<string>;
        }
      `);

      expect(t.event).toEqual({
        name: 'app:userLogin',
        method: 'loginEvent',
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
          text: '',
          tags: [],
        },
      });
    });

    it('should work with object destructuring constants', () => {
      const t = transpileModule(`
        const EVENTS = {
          USER_LOGIN: 'userLogin',
          USER_LOGOUT: 'userLogout'
        } as const;
        
        const { USER_LOGIN } = EVENTS;
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: USER_LOGIN }) loginEvent: EventEmitter<string>;
          
          @Listen(USER_LOGIN)
          handleLogin() {
            console.log('login handled');
          }
        }
      `);

      expect(t.event.name).toBe('userLogin');
      expect(t.listeners[0].name).toBe('userLogin');
    });

    it('should work with both @Event and @Listen using the same constant', () => {
      const t = transpileModule(`
        const CUSTOM_EVENT = 'myCustomEvent';
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: CUSTOM_EVENT }) customEvent: EventEmitter<string>;
          
          @Listen(CUSTOM_EVENT)
          handleCustomEvent() {
            console.log('custom event handled');
          }
        }
      `);

      expect(t.event.name).toBe('myCustomEvent');
      expect(t.listeners[0].name).toBe('myCustomEvent');
    });

    it('should fall back to member name when constant cannot be resolved', () => {
      const t = transpileModule(`
        // This variable won't be resolvable at compile time
        const dynamicEventName = Math.random() > 0.5 ? 'event1' : 'event2';
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: dynamicEventName }) fallbackEvent: EventEmitter<string>;
        }
      `);

      // Should fall back to the member name when constant can't be resolved
      expect(t.event.name).toBe('fallbackEvent');
    });

    it('should handle mixed constant and literal usage', () => {
      const t = transpileModule(`
        const USER_EVENT = 'userAction';
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: USER_EVENT }) userEvent: EventEmitter<string>;
          @Event({ eventName: 'literalEvent' }) literalEvent: EventEmitter<string>;
          
          @Listen(USER_EVENT)
          handleUserEvent() {}
          
          @Listen('literalEvent')
          handleLiteralEvent() {}
        }
      `);

      expect(t.events).toHaveLength(2);
      expect(t.events.find((e) => e.method === 'userEvent')?.name).toBe('userAction');
      expect(t.events.find((e) => e.method === 'literalEvent')?.name).toBe('literalEvent');

      expect(t.listeners).toHaveLength(2);
      expect(t.listeners.find((l) => l.method === 'handleUserEvent')?.name).toBe('userAction');
      expect(t.listeners.find((l) => l.method === 'handleLiteralEvent')?.name).toBe('literalEvent');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined constants gracefully', () => {
      const t = transpileModule(`
        const UNDEFINED_CONST = undefined;
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: UNDEFINED_CONST }) undefinedEvent: EventEmitter<string>;
        }
      `);

      // Should fall back to member name when constant is undefined
      expect(t.event.name).toBe('undefinedEvent');
    });

    it('should handle null constants gracefully', () => {
      const t = transpileModule(`
        const NULL_CONST = null;
        
        @Component({tag: 'cmp-a'})
        export class CmpA {
          @Event({ eventName: NULL_CONST }) nullEvent: EventEmitter<string>;
        }
      `);

      // Should fall back to member name when constant is null
      expect(t.event.name).toBe('nullEvent');
    });
  });
});

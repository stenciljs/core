import { BUILD } from '@app-data';

import { parseClassList, setAccessor } from '../set-accessor';

describe('setAccessor for custom elements', () => {
  let elm: any;

  beforeEach(() => {
    elm = document.createElement('my-tag');
  });

  describe('event listener', () => {
    it('should allow public method starting with "on" and capital 3rd character', () => {
      const addEventSpy = jest.spyOn(elm, 'addEventListener');

      elm.onMyMethod = () => {
        /**/
      };

      const fn = () => {
        /**/
      };
      setAccessor(elm, 'onMyMethod', undefined, fn, false, 0);

      expect(addEventSpy).toHaveBeenCalledTimes(0);
    });

    it('should remove standardized event listener when has old value, but no new', () => {
      const addEventSpy = jest.spyOn(elm, 'addEventListener');
      const removeEventSpy = jest.spyOn(elm, 'removeEventListener');

      const orgValue = () => {
        /**/
      };
      setAccessor(elm, 'onClick', undefined, orgValue, false, 0);

      setAccessor(elm, 'onClick', orgValue, undefined, false, 0);

      expect(addEventSpy).toHaveBeenCalledTimes(1);
      expect(addEventSpy).toHaveBeenCalledWith('click', orgValue, false);
      expect(removeEventSpy).toHaveBeenCalledWith('click', orgValue, false);
    });

    it('should remove standardized multiple-word then add event listener w/ different value', () => {
      const addEventSpy = jest.spyOn(elm, 'addEventListener');
      const removeEventSpy = jest.spyOn(elm, 'removeEventListener');

      const orgValue = () => {
        /**/
      };
      setAccessor(elm, 'onMouseOver', undefined, orgValue, false, 0);

      setAccessor(elm, 'onMouseOver', orgValue, undefined, false, 0);

      expect(addEventSpy).toHaveBeenCalledWith('mouseover', orgValue, false);
      expect(removeEventSpy).toHaveBeenCalledWith('mouseover', orgValue, false);
    });

    it('should remove standardized then add event listener w/ different value', () => {
      const addEventSpy = jest.spyOn(elm, 'addEventListener');
      const removeEventSpy = jest.spyOn(elm, 'removeEventListener');

      const orgValue = () => {
        /**/
      };
      setAccessor(elm, 'onClick', undefined, orgValue, false, 0);

      const newValue = () => {
        /**/
      };
      setAccessor(elm, 'onClick', orgValue, newValue, false, 0);

      expect(addEventSpy).toHaveBeenCalledTimes(2);
      expect(removeEventSpy).toHaveBeenCalledTimes(1);
    });

    it('should add custom event listener when no old value', () => {
      const addEventSpy = jest.spyOn(elm, 'addEventListener');
      const removeEventSpy = jest.spyOn(elm, 'removeEventListener');

      const newValue = () => {
        /**/
      };

      setAccessor(elm, 'onIonChange', undefined, newValue, false, 0);

      expect(addEventSpy).toHaveBeenCalledWith('ionChange', newValue, false);
      expect(removeEventSpy).not.toHaveBeenCalled();
    });

    it('should add standardized multiple-word event listener when no old value', () => {
      const addEventSpy = jest.spyOn(elm, 'addEventListener');
      const removeEventSpy = jest.spyOn(elm, 'removeEventListener');

      const newValue = () => {
        /**/
      };

      setAccessor(elm, 'onMouseOver', undefined, newValue, false, 0);

      expect(addEventSpy).toHaveBeenCalledWith('mouseover', newValue, false);
      expect(removeEventSpy).not.toHaveBeenCalled();
    });

    it('should add standardized event listener when no old value', () => {
      const addEventSpy = jest.spyOn(elm, 'addEventListener');
      const removeEventSpy = jest.spyOn(elm, 'removeEventListener');

      const newValue = () => {
        /**/
      };

      setAccessor(elm, 'onClick', undefined, newValue, false, 0);

      expect(addEventSpy).toHaveBeenCalledWith('click', newValue, false);
      expect(removeEventSpy).not.toHaveBeenCalled();
    });

    it('should add a capture style event listener', () => {
      const addEventSpy = jest.spyOn(elm, 'addEventListener');
      const removeEventSpy = jest.spyOn(elm, 'removeEventListener');

      const newValue = () => {
        /**/
      };

      setAccessor(elm, 'onClickCapture', undefined, newValue, false, 0);

      expect(addEventSpy).toHaveBeenCalledWith('click', newValue, true);
      expect(removeEventSpy).not.toHaveBeenCalled();
    });

    it('should remove a capture style event listener', () => {
      const addEventSpy = jest.spyOn(elm, 'addEventListener');
      const removeEventSpy = jest.spyOn(elm, 'removeEventListener');

      const orgValue = () => {
        /**/
      };

      setAccessor(elm, 'onClickCapture', undefined, orgValue, false, 0);
      setAccessor(elm, 'onClickCapture', orgValue, undefined, false, 0);

      expect(addEventSpy).toHaveBeenCalledTimes(1);
      expect(addEventSpy).toHaveBeenCalledWith('click', orgValue, true);
      expect(removeEventSpy).toHaveBeenCalledWith('click', orgValue, true);
    });
  });

  it('should set object property to child', () => {
    const oldValue: any = 'someval';
    const newValue: any = { some: 'obj' };

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.myprop).toBe(newValue);
    expect(elm.hasAttribute('myprop')).toBe(false);
  });

  it('should set array property to child', () => {
    const oldValue: any = 'someval';
    const newValue: any = [1, 2, 3];

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.myprop).toBe(newValue);
    expect(elm.hasAttribute('myprop')).toBe(false);
  });

  it('should not set ref as a property', () => {
    const oldValue: any = 'someval';
    const newValue: any = function meFun() {
      /**/
    };

    setAccessor(elm, 'ref', oldValue, newValue, false, 0);
    expect(elm.ref).toBeUndefined();
    expect(elm.hasAttribute('ref')).toBe(false);
  });

  it('should set function property to child', () => {
    const oldValue: any = 'someval';
    const newValue: any = function meFun() {
      /**/
    };

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.myprop).toBe(newValue);
    expect(elm.hasAttribute('myprop')).toBe(false);
  });

  it('should set null property to child and it is a child prop', () => {
    const oldValue: any = 'someval';
    const newValue: any = null;
    elm.myprop = oldValue;

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.hasAttribute('myprop')).toBe(false);
  });

  it('should set string property to child when child already has that property', () => {
    const oldValue: any = 'someval';
    const newValue: any = 'stringval';
    elm.myprop = oldValue;

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.myprop).toBe('stringval');
    expect(elm.hasAttribute('myprop')).toBe(false);
  });

  it('should set null property to child when known child component should have that property', () => {
    elm = document.createElement('cmp-a');

    const oldValue: any = 'someval';
    const newValue: any = null;
    elm.cmpAprop = oldValue;

    setAccessor(elm, 'cmpAprop', oldValue, newValue, false, 0);
    expect(elm.cmpAprop).toBe(null);
    expect(elm.hasAttribute('cmpAprop')).toBe(false);
  });

  it('should do nothing when setting null prop but child doesnt have that prop', () => {
    const oldValue: any = 'someval';
    const newValue: any = null;

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.myprop).toBeUndefined();
    expect(elm.hasAttribute('myprop')).toBe(false);
  });

  it('should do nothing when setting undefined prop but child doesnt have that prop', () => {
    const oldValue: any = 'someval';
    const newValue: any = undefined;

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.myprop).toBeUndefined();
    expect(elm.hasAttribute('myprop')).toBe(false);

    const propDesc = Object.getOwnPropertyDescriptor(elm, 'myprop');
    expect(propDesc).toBeUndefined();
  });

  it('should set false boolean to attribute', () => {
    const oldValue: any = 'someval';
    const newValue: any = false;

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.myprop).toBeUndefined();

    expect(elm).toEqualAttributes({});
  });

  it('should add aria role attribute', () => {
    setAccessor(elm, 'role', undefined, 'tab', true, 0);
    expect(elm.hasAttribute('role')).toBe(true);
    expect(elm.getAttribute('role')).toBe('tab');
  });

  it('should update aria role attribute', () => {
    elm.setAttribute('role', 'tab');

    setAccessor(elm, 'role', 'tab', 'other', true, 0);
    expect(elm.getAttribute('role')).toBe('other');
  });

  it('should remove aria role attribute', () => {
    elm.setAttribute('role', 'tab');

    setAccessor(elm, 'role', 'tab', undefined, true, 0);
    expect(elm.hasAttribute('role')).toBe(false);
  });

  it('should update svg attribute', () => {
    elm.setAttribute('transform', 'rotate(45 72 72)');
    const oldValue: any = 'rotate(45 72 72)';
    const newValue: any = 'rotate(45 27 27)';

    setAccessor(elm, 'transform', oldValue, newValue, true, 0);
    expect(elm.transform).toBeUndefined();
    expect(elm.getAttribute('transform')).toBe('rotate(45 27 27)');
  });

  it('should add svg attribute', () => {
    const oldValue: any = undefined;
    const newValue: any = 'rotate(45 27 27)';

    setAccessor(elm, 'transform', oldValue, newValue, true, 0);
    expect(elm.transform).toBeUndefined();
    expect(elm.hasAttribute('transform')).toBe(true);
  });

  it('should remove svg attribute', () => {
    elm.setAttribute('transform', 'rotate(45 27 27)');
    const oldValue: any = 'rotate(45 27 27)';
    const newValue: any = undefined;

    setAccessor(elm, 'transform', oldValue, newValue, true, 0);
    expect(elm.transform).toBeUndefined();
    expect(elm.hasAttribute('transform')).toBe(false);
  });

  it('should set true boolean to attribute', () => {
    const oldValue: any = 'someval';
    const newValue: any = true;

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.myprop).toBeUndefined();
    expect(elm).toEqualAttributes({ myprop: '' });
  });

  it('should set number to attribute', () => {
    const oldValue: any = 'someval';
    const newValue: any = 88;

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.myprop).toBeUndefined();
    expect(elm).toEqualAttributes({ myprop: '88' });
  });

  it('should set string to attribute', () => {
    const oldValue: any = 'someval';
    const newValue: any = 'stringval';

    setAccessor(elm, 'myprop', oldValue, newValue, false, 0);
    expect(elm.myprop).toBeUndefined();
    expect(elm).toEqualAttributes({ myprop: 'stringval' });
  });

  it('ignore when updating readonly properties', () => {
    const readOnlyProp = 'namespaceURI';
    const oldReadOnlyVal = 'http://www.w3.org/1999/xhtml';
    setAccessor(elm, readOnlyProp, oldReadOnlyVal, 'foobar', false, 0);
    expect(elm[readOnlyProp]).toBe(oldReadOnlyVal);
  });
});

describe('setAccessor for inputs', () => {
  describe('simple attributes', () => {
    describe('should not add attribute when prop is undefined or null', () => {
      function expectStraightForwardAttribute(propName: string, newValue: any, oldValue: any) {
        const inputElm = document.createElement('input');
        setAccessor(inputElm, propName, oldValue, newValue, false, 0);

        expect(inputElm.hasAttribute(propName)).toBe(false);
      }

      it(`aria-disabled`, () => {
        expectStraightForwardAttribute('aria-disabled', undefined, undefined);
        expectStraightForwardAttribute('aria-disabled', null, undefined);
      });
      it(`autoCapitalize`, () => {
        expectStraightForwardAttribute('autoCapitalize', undefined, undefined);
        expectStraightForwardAttribute('autoCapitalize', null, undefined);
      });
      it(`autoComplete`, () => {
        expectStraightForwardAttribute('autoComplete', undefined, undefined);
        expectStraightForwardAttribute('autoComplete', null, undefined);
      });
      it(`autoCorrect`, () => {
        expectStraightForwardAttribute('autoCorrect', undefined, undefined);
        expectStraightForwardAttribute('autoCorrect', null, undefined);
      });
      it(`autoFocus`, () => {
        expectStraightForwardAttribute('autoFocus', undefined, undefined);
        expectStraightForwardAttribute('autoFocus', null, undefined);
      });
      it(`inputMode`, () => {
        expectStraightForwardAttribute('inputMode', undefined, undefined);
        expectStraightForwardAttribute('inputMode', null, undefined);
      });
      it(`results`, () => {
        expectStraightForwardAttribute('results', undefined, undefined);
        expectStraightForwardAttribute('results', null, undefined);
      });
      it(`spellCheck`, () => {
        expectStraightForwardAttribute('spellCheck', undefined, undefined);
        expectStraightForwardAttribute('spellCheck', null, undefined);
      });

      it('checked', () => {
        const inputElm = document.createElement('input');
        setAccessor(inputElm, 'checked', false, true, false, 0);
        expect(inputElm.checked).toEqual(true);

        setAccessor(inputElm, 'checked', true, false, false, 0);
        expect(inputElm.checked).toEqual(false);
      });
    });

    describe('should update when prop is defined', () => {
      function expectStraightForwardAttribute(propName: string, newValue: any, oldValue: any) {
        const inputElm = document.createElement('input');
        setAccessor(inputElm, propName, oldValue, newValue, false, 0);

        const expected = newValue === true ? '' : newValue.toString();
        expect(inputElm).toEqualAttributes({ [propName]: expected });
      }

      it(`aria-disabled should be added when set to true`, () => {
        expectStraightForwardAttribute('aria-disabled', true, undefined);
      });
      it(`autoCapitalize should be added when set to 'sentences'`, () => {
        expectStraightForwardAttribute('autoCapitalize', 'sentences', undefined);
      });
      it(`autoComplete should be added when set to true`, () => {
        expectStraightForwardAttribute('autoComplete', true, undefined);
      });
      it(`autoCorrect should be added when set to true`, () => {
        expectStraightForwardAttribute('autoCorrect', true, undefined);
      });
      it(`autoFocus should be added when set to true`, () => {
        expectStraightForwardAttribute('autoFocus', true, undefined);
      });
      it(`inputMode should be added when set to 'numeric'`, () => {
        expectStraightForwardAttribute('inputMode', 'numeric', undefined);
      });
      it(`results should be added when set to 'blah'`, () => {
        expectStraightForwardAttribute('results', 'blah', undefined);
      });
      it(`spellCheck should be added when set to true`, () => {
        expectStraightForwardAttribute('spellCheck', true, undefined);
      });
    });
  });

  describe('special attributes', () => {
    describe('should not add attribute when prop is undefined or null', () => {
      function expectSpecialAttribute(propName: string, newValue: any, oldValue: any) {
        const inputElm = document.createElement('input');
        setAccessor(inputElm, propName, oldValue, newValue, false, 0);

        expect(inputElm).toEqualAttributes({});
      }

      it(`accept`, () => {
        expectSpecialAttribute('accept', undefined, undefined);
        expectSpecialAttribute('accept', null, undefined);
      });

      it(`minLength`, () => {
        expectSpecialAttribute('minLength', undefined, undefined);
        expectSpecialAttribute('minLength', null, undefined);
      });

      it(`maxLength`, () => {
        expectSpecialAttribute('maxLength', undefined, undefined);
        expectSpecialAttribute('maxLength', null, undefined);
      });
      it(`name`, () => {
        expectSpecialAttribute('name', undefined, undefined);
        expectSpecialAttribute('name', null, undefined);
      });
      it(`pattern`, () => {
        expectSpecialAttribute('pattern', undefined, undefined);
        expectSpecialAttribute('pattern', null, undefined);
      });
      it(`placeholder`, () => {
        expectSpecialAttribute('placeholder', undefined, undefined);
        expectSpecialAttribute('placeholder', null, undefined);
      });
      it(`step`, () => {
        expectSpecialAttribute('step', undefined, undefined);
        expectSpecialAttribute('step', null, undefined);
      });
      it(`size`, () => {
        expectSpecialAttribute('size', undefined, undefined);
        expectSpecialAttribute('size', null, undefined);
      });
      it(`type`, () => {
        expectSpecialAttribute('type', undefined, undefined);
        expectSpecialAttribute('type', null, undefined);
      });
    });

    describe('should update when prop is defined', () => {
      function expectSpecialAttributeDefined(propName: string, newValue: any, oldValue: any) {
        const inputElm = document.createElement('input');
        setAccessor(inputElm, propName, oldValue, newValue, false, 0);

        expect(inputElm).toEqualAttributes({ [propName]: newValue.toString() });
        expect((inputElm as any)[propName]).toBe(newValue);
      }

      it(`accept should be added when set to 'text/html'`, () => {
        expectSpecialAttributeDefined('accept', 'text/html', undefined);
      });
      it(`minLength should be added when set to 10`, () => {
        expectSpecialAttributeDefined('minLength', 10, undefined);
      });
      it(`maxLength should be added when set to 100`, () => {
        expectSpecialAttributeDefined('maxLength', 100, undefined);
      });
      it(`name should be added when set to 'test'`, () => {
        expectSpecialAttributeDefined('name', 'test', undefined);
      });
      it(`pattern should be added when set to '[a-zA-Z0-9]+'`, () => {
        expectSpecialAttributeDefined('pattern', '[a-zA-Z0-9]+', undefined);
      });
      it(`placeholder should be added when set to 'text placeholder'`, () => {
        expectSpecialAttributeDefined('placeholder', 'text placeholder', undefined);
      });
      it(`step should be added when set to 'any'`, () => {
        expectSpecialAttributeDefined('step', 'any', undefined);
      });
      it(`size should be added when set to 40`, () => {
        expectSpecialAttributeDefined('size', 40, undefined);
      });
      it(`type should be added when set to 'tel'`, () => {
        expectSpecialAttributeDefined('type', 'tel', undefined);
      });
    });
  });

  describe('boolean attributes', () => {
    describe('should not add attribute when prop is undefined or null', () => {
      function expectBooleanAttribute(propName: string, newValue: any, oldValue: any) {
        const inputElm = document.createElement('input');
        setAccessor(inputElm, propName, oldValue, newValue, false, 0);

        expect(inputElm.hasAttribute(propName)).toBe(false);
      }

      it(`disabled`, () => {
        expectBooleanAttribute('disabled', undefined, undefined);
        expectBooleanAttribute('disabled', null, undefined);
      });
      it(`multiple`, () => {
        expectBooleanAttribute('multiple', undefined, undefined);
        expectBooleanAttribute('multiple', null, undefined);
      });
      it(`required`, () => {
        expectBooleanAttribute('required', undefined, undefined);
        expectBooleanAttribute('required', null, undefined);
      });
      it(`readOnly`, () => {
        expectBooleanAttribute('readOnly', undefined, undefined);
        expectBooleanAttribute('readOnly', null, undefined);
      });
    });

    describe('should update when prop is defined', () => {
      function expectBooleanAttributeDefined(propName: string, newValue: any, oldValue: any) {
        const inputElm = document.createElement('input');
        setAccessor(inputElm, propName, oldValue, newValue, false, 0);

        expect(inputElm).toEqualAttributes({ [propName]: '' });
        expect((inputElm as any)[propName]).toBe(newValue);
      }

      it(`disabled should be added when set to true`, () => {
        expectBooleanAttributeDefined('disabled', true, undefined);
      });
      it(`multiple should be added when set to true`, () => {
        expectBooleanAttributeDefined('multiple', true, undefined);
      });
      it(`required should be added when set to true`, () => {
        expectBooleanAttributeDefined('required', true, undefined);
      });
      it(`readOnly should be added when set to true`, () => {
        expectBooleanAttributeDefined('readOnly', true, undefined);
      });
    });
  });

  describe('min/max attributes', () => {
    describe('should not add attribute when prop is undefined or null', () => {
      function expectMinMaxAttribute(propName: string, newValue: any, oldValue: any) {
        const inputElm = document.createElement('input');
        setAccessor(inputElm, propName, oldValue, newValue, false, 0);

        expect(inputElm.hasAttribute(propName)).toBe(false);
      }

      it(`min`, () => {
        expectMinMaxAttribute('min', undefined, undefined);
        expectMinMaxAttribute('min', null, undefined);
      });
      it(`max`, () => {
        expectMinMaxAttribute('max', undefined, undefined);
        expectMinMaxAttribute('max', null, undefined);
      });
    });

    describe('should update when prop is defined', () => {
      function expectMinMaxAttributeDefined(propName: string, newValue: any, oldValue: any) {
        const inputElm = document.createElement('input');
        setAccessor(inputElm, propName, oldValue, newValue, false, 0);

        expect(inputElm).toEqualAttributes({ [propName]: newValue.toString() });
        expect((inputElm as any)[propName]).toBe(newValue.toString());
      }

      it(`min should be added when set to 20`, () => {
        expectMinMaxAttributeDefined('min', 20, undefined);
      });
      it(`max should be added when set to 40`, () => {
        expectMinMaxAttributeDefined('max', 40, undefined);
      });
    });
  });
});

describe('setAccessor for standard html elements', () => {
  beforeEach(() => {
    BUILD.hydrateClientSide = true;
  });

  describe('simple global attributes', () => {
    it('should not add attribute when prop is undefined or null', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'title', undefined, undefined, false, 0);

      expect(inputElm.hasAttribute('title')).toBe(false);
    });

    it('should add attribute when prop is string', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'title', undefined, 'lime', false, 0);

      expect(inputElm.hasAttribute('title')).toBe(true);
    });

    it('should add attribute when prop is boolean', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'color', undefined, true, false, 0);

      expect(inputElm.hasAttribute('color')).toBe(true);
    });

    it('should add attribute when prop is number', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'color', undefined, 1, false, 0);

      expect(inputElm.hasAttribute('color')).toBe(true);
    });

    it('should remove attribute when prop is undefined', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'title', undefined, 'lime', false, 0);
      setAccessor(inputElm, 'title', 'lime', undefined, false, 0);

      expect(inputElm.hasAttribute('title')).toBe(false);
    });

    it('should remove attribute when prop is null', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'title', undefined, 'lime', false, 0);
      setAccessor(inputElm, 'title', 'lime', null, false, 0);

      expect(inputElm.hasAttribute('title')).toBe(false);
    });
  });

  describe('simple nonstandard attributes', () => {
    it('should not add attribute when prop is undefined or null', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'color', undefined, undefined, false, 0);

      expect(inputElm.hasAttribute('color')).toBe(false);
    });

    it('should add attribute when prop is string', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'color', undefined, 'lime', false, 0);

      expect(inputElm.hasAttribute('color')).toBe(true);
    });

    it('should add attribute when prop is boolean', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'color', undefined, true, false, 0);

      expect(inputElm.hasAttribute('color')).toBe(true);
    });

    it('should add attribute when prop is number', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'color', undefined, 1, false, 0);

      expect(inputElm.hasAttribute('color')).toBe(true);
    });

    it('should aria role attribute', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'role', undefined, 'main', false, 0);

      expect(inputElm.hasAttribute('role')).toBe(true);
    });

    it('should remove attribute when prop is undefined', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'color', undefined, 1, false, 0);
      setAccessor(inputElm, 'color', 1, undefined, false, 0);

      expect(inputElm.hasAttribute('color')).toBe(false);
    });

    it('should remove attribute when prop is null', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'color', undefined, 1, false, 0);
      setAccessor(inputElm, 'color', 1, null, false, 0);

      expect(inputElm.hasAttribute('color')).toBe(false);
    });
    it('should remove aria role attribute', () => {
      const inputElm = document.createElement('section');
      setAccessor(inputElm, 'role', undefined, 'main', false, 0);
      setAccessor(inputElm, 'role', 'main', undefined, false, 0);

      expect(inputElm.hasAttribute('role')).toBe(false);
    });
  });

  describe('class attribute', () => {
    it('should add classes', () => {
      const elm = document.createElement('section');
      setAccessor(elm, 'class', undefined, 'class1 class2   class3  ', false, 0);
      expect(elm).toHaveClasses(['class1', 'class2', 'class3']);

      setAccessor(elm, 'class', undefined, 'new', false, 0);
      expect(elm).toHaveClasses(['class1', 'class2', 'class3', 'new']);

      setAccessor(elm, 'class', '  class1 class2', 'new class4', false, 0);
      expect(elm).toHaveClasses(['class3', 'new', 'class4']);

      setAccessor(
        elm,
        'class',
        undefined,
        `class1
              class2
       class3  `,
        false,
        0,
      );
      expect(elm).toHaveClasses(['class1', 'class2', 'class3']);
    });

    it('should not add any classes', () => {
      const elm = document.createElement('section');
      setAccessor(elm, 'class', '', '', false, 0);
      expect(elm).toHaveClasses([]);

      setAccessor(elm, 'class', 'class1 class3 class2', 'class1 class2 class3', false, 0);
      expect(elm).toHaveClasses([]);

      setAccessor(elm, 'class', 'class1 class3 class2', undefined, false, 0);
      expect(elm).toHaveClasses([]);

      setAccessor(elm, 'class', undefined, undefined, false, 0);
      expect(elm).toHaveClasses([]);

      setAccessor(elm, 'class', '', `\n      \n      \n     `, false, 0);
      expect(elm).toHaveClasses([]);
    });

    it('should remove classes', () => {
      const elm = document.createElement('section');
      elm.classList.add('icon', 'ion-color');

      setAccessor(elm, 'class', 'icon', 'icon2', false, 0);
      expect(elm).toHaveClasses(['ion-color', 'icon2']);

      setAccessor(
        elm,
        'class',
        `icon
           ion-color`,
        'icon2',
        false,
        0,
      );
      expect(elm).toHaveClasses(['icon2']);
    });

    it('should not have duplicated classes', () => {
      const elm = document.createElement('section');
      elm.classList.add('md');

      setAccessor(elm, 'class', undefined, 'md ios', false, 0);
      expect(elm.className).toEqual('md ios');
    });

    it('should also add one class', () => {
      const elm = document.createElement('section');
      elm.classList.add('md');

      setAccessor(elm, 'class', 'md', 'md ios', false, 0);
      expect(elm.className).toEqual('md ios');
    });

    it('should remove one class', () => {
      const elm = document.createElement('section');
      elm.classList.add('md');

      setAccessor(elm, 'class', 'md', '', false, 0);
      expect(elm.className).toEqual('');
    });

    it('should add scope classes on initial render if `s-si` set', () => {
      const elm = document.createElement('section');

      // not s-si set
      setAccessor(elm, 'class', 'a-scope-id', undefined, false, 0, true);
      expect(elm.className).toEqual('');

      (elm as any)['s-si'] = 'a-scope-id';

      setAccessor(elm, 'class', '', undefined, false, 0, true);
      expect(elm.className).toEqual('a-scope-id');

      setAccessor(
        elm,
        'class',
        'a-scope-id-something a-scope-id-something-else unrelated-old-thing',
        undefined,
        false,
        0,
        true,
      );
      expect(elm.className).toEqual('a-scope-id a-scope-id-something a-scope-id-something-else');

      elm.className = '';
      setAccessor(elm, 'class', 'something-old', 'something-new', false, 0, true);
      expect(elm.className).toEqual('something-new a-scope-id');

      elm.className = '';
      setAccessor(elm, 'class', 'something-old a-scope-id-something', 'something-new', false, 0, true);
      expect(elm.className).toEqual('something-new a-scope-id a-scope-id-something');

      // just check it reverts to normal behavior after initial render
      elm.className = '';
      setAccessor(elm, 'class', 'something-old a-scope-id-something', 'something-new', false, 0);
      expect(elm.className).toEqual('something-new');
    });
  });

  describe('style attribute', () => {
    it('should add styles', () => {
      let elm = document.createElement('section');
      const newStyles = {
        'box-shadow': '1px',
        color: 'blue',
        paddingLeft: '88px',
      };
      setAccessor(elm, 'style', undefined, newStyles, false, 0);
      expect(elm.style.cssText).toEqual('box-shadow: 1px; color: blue; padding-left: 88px;');

      elm = document.createElement('my-tag');
      setAccessor(
        elm,
        'style',
        {},
        {
          'font-size': '12px',
          marginRight: '55px',
        },
        false,
        0,
      );
      expect(elm.style.cssText).toEqual('font-size: 12px; margin-right: 55px;');

      elm = document.createElement('my-tag');
      setAccessor(
        elm,
        'style',
        {
          'font-size': '12px',
          color: 'blue',
        },
        {
          'font-size': '20px',
        },
        false,
        0,
      );

      expect(elm.style.cssText).toEqual('font-size: 20px;');
    });

    it('should not add styles', () => {
      const elm = document.createElement('section');
      setAccessor(elm, 'style', undefined, undefined, false, 0);
      expect(elm.style.cssText).toEqual('');

      setAccessor(
        elm,
        'style',
        { color: 'blue', 'font-size': '12px', paddingLeft: '88px' },
        { color: 'blue', 'font-size': '12px', paddingLeft: '88px' },
        false,
        0,
      );
      expect(elm.style.cssText).toEqual('');

      setAccessor(elm, 'style', { color: 'blue', 'font-size': '12px' }, undefined, false, 0);
      expect(elm.style.cssText).toEqual('');
    });

    it('should change styles only when it has a new value', () => {
      const elm = document.createElement('section');
      elm.style.setProperty('color', 'black');
      elm.style.setProperty('padding', '20px');

      setAccessor(
        elm,
        'style',
        { color: 'blue', padding: '20px', marginRight: '88px' },
        { color: 'blue', padding: '30px', marginRight: '55px' },
        false,
        0,
      );

      expect(elm.style.cssText).toEqual('color: black; padding: 30px; margin-right: 55px;');
    });

    it('should remove styles', () => {
      const elm = document.createElement('section');
      elm.style.setProperty('color', 'black');
      elm.style.setProperty('padding', '20px');
      elm.style.setProperty('margin', '20px');
      elm.style.setProperty('font-size', '88px');

      expect(elm.style.cssText).toEqual('color: black; padding: 20px; margin: 20px; font-size: 88px;');

      setAccessor(elm, 'style', { color: 'black', padding: '20px', fontSize: '88px' }, undefined, false, 0);
      expect(elm.style.cssText).toEqual('margin: 20px;');

      setAccessor(elm, 'style', { margin: '20px' }, { margin: '30px', color: 'orange' }, false, 0);
      expect(elm.style.cssText).toEqual('margin: 30px; color: orange;');
    });
  });

  it('uses setAttribute if element has not setter', () => {
    const elm = document.createElement('button');
    const spy = jest.spyOn(elm, 'setAttribute');
    setAccessor(elm, 'form', undefined, 'some-form', false, 0);
    expect(spy.mock.calls).toEqual([['form', 'some-form']]);

    const elm2 = document.createElement('button');
    const spy2 = jest.spyOn(elm2, 'setAttribute');
    setAccessor(elm2, 'textContent', undefined, 'some-content', false, 0);
    expect(spy2.mock.calls).toEqual([]);
  });

  describe('parseClassList', () => {
    it('should parse class list', () => {
      const classList = parseClassList('class1 class2 class3');
      expect(classList).toEqual(['class1', 'class2', 'class3']);
    });

    it('should not parse class list', () => {
      expect(parseClassList('')).toEqual([]);
      // @ts-expect-error
      expect(parseClassList()).toEqual([]);
      expect(parseClassList(null)).toEqual([]);
    });

    it('should parse SVGAnimatedString', () => {
      const classList = parseClassList({ baseVal: 'class1 class2 class3' } as SVGAnimatedString);
      expect(classList).toEqual(['class1', 'class2', 'class3']);
    });
  });
});

import { Component, Event, EventEmitter, Listen, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('listen', () => {
  it('listen to click on host, from elm.click()', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @State() clicks = 0;

      @Listen('click')
      buttonClick() {
        this.clicks++;
      }

      render() {
        return `${this.clicks}`;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a>0</cmp-a>
    `);

    root.click();
    await waitForChanges();

    expect(root).toEqualHtml(`
      <cmp-a>1</cmp-a>
    `);

    root.click();
    await waitForChanges();

    expect(root).toEqualHtml(`
      <cmp-a>2</cmp-a>
    `);
  });

  it('should listen from parent', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @State() selfClicks = 0;
      @State() bodyClicks = 0;
      @State() documentClicks = 0;
      @State() windowClicks = 0;

      @Listen('click')
      onClick() {
        this.selfClicks++;
      }

      @Listen('click', { target: 'body' })
      onBodyClick() {
        this.bodyClicks++;
      }

      @Listen('click', { target: 'document' })
      onDocumentClick() {
        this.documentClicks++;
      }

      @Listen('click', { target: 'window' })
      onWindowClick() {
        this.windowClicks++;
      }

      render() {
        return `${this.selfClicks},${this.bodyClicks},${this.documentClicks},${this.windowClicks}`;
      }
    }

    const { win, doc, body, root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<other><parent><cmp-a></cmp-a></parent></other>`,
    });

    const parent = doc.querySelector('parent') as any;
    const other = doc.querySelector('other') as any;

    expect(root).toEqualHtml(`
      <cmp-a>0,0,0,0</cmp-a>
    `);

    root.click();
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>1,1,1,1</cmp-a>
    `);

    parent.click();
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>1,2,2,2</cmp-a>
    `);

    other.click();
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>1,3,3,3</cmp-a>
    `);

    body.click();
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>1,4,4,4</cmp-a>
    `);

    doc.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>1,4,5,5</cmp-a>
    `);

    win.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>1,4,5,6</cmp-a>
    `);
  });

  it('listen before load', async () => {
    let log = '';
    let eventId = 0;
    function getEventDetail() {
      return `event${eventId++} `;
    }
    @Component({ tag: 'cmp-a' })
    class CmpA {
      renderCount = 0;

      @Event() event: EventEmitter;
      @State() nuEvents = 0;

      @Listen('event')
      onEvent(ev: CustomEvent<string>) {
        log += ev.detail;
        this.nuEvents++;
      }

      connectedCallback() {
        this.event.emit(getEventDetail());
        log += 'connectedCallback ';
        this.event.emit(getEventDetail());
      }

      componentWillLoad() {
        this.event.emit(getEventDetail());
        log += 'componentWillLoad ';
        this.event.emit(getEventDetail());
      }

      componentDidLoad() {
        // this.event.emit(getEventDetail());
        log += 'componentDidLoad ';
      }

      render() {
        this.renderCount++;
        return `${this.renderCount} ${this.nuEvents}`;
      }
    }

    const { doc, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: '',
    });

    const a = doc.createElement('cmp-a');
    doc.body.appendChild(a);

    a.dispatchEvent(
      new CustomEvent('event', {
        detail: getEventDetail(),
      }),
    );
    a.dispatchEvent(
      new CustomEvent('event', {
        detail: getEventDetail(),
      }),
    );
    a.dispatchEvent(
      new CustomEvent('event', {
        detail: getEventDetail(),
      }),
    );

    await Promise.resolve();
    expect(log).toEqual('');
    expect(a).toEqualHtml(`<cmp-a></cmp-a>`);

    await waitForChanges();
    expect(log).toEqual(
      `connectedCallback event0 event1 event2 event3 event4 event5 componentWillLoad event6 componentDidLoad `,
    );
    expect(a).toEqualHtml(`<cmp-a>1 7</cmp-a>`);
    await waitForChanges();
    expect(a).toEqualHtml(`<cmp-a>1 7</cmp-a>`);
  });

  it('disconnects target listeners when element is not connected to DOM', async () => {
    let events = 0;
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Listen('testEvent', { target: 'document' })
      buttonClick() {
        events++;
      }

      render() {
        return '';
      }
    }

    const { doc, waitForChanges } = await newSpecPage({
      components: [CmpA],
    });

    jest.spyOn(doc, 'addEventListener');
    jest.spyOn(doc, 'removeEventListener');

    doc.createElement('cmp-a');
    await waitForChanges();

    // Event listener will never be called
    expect(events).toEqual(0);

    // no event listeners have been added as the element is not connected to the DOM
    expect(doc.addEventListener.mock.calls.length).toBe(0);
    expect(doc.removeEventListener.mock.calls.length).toBe(0);
  });
});

describe('global', () => {
  it('HTMLElement', () => {
    expect(HTMLElement).toBeDefined();
    expect(HTMLAnchorElement).toBeDefined();
    expect(HTMLBaseElement).toBeDefined();
    expect(HTMLButtonElement).toBeDefined();
    expect(HTMLCanvasElement).toBeDefined();
    expect(HTMLFormElement).toBeDefined();
    expect(HTMLImageElement).toBeDefined();
    expect(HTMLInputElement).toBeDefined();
    expect(HTMLLinkElement).toBeDefined();
    expect(HTMLMetaElement).toBeDefined();
    expect(HTMLScriptElement).toBeDefined();
    expect(HTMLStyleElement).toBeDefined();
    expect(HTMLTemplateElement).toBeDefined();
    expect(HTMLTitleElement).toBeDefined();
  });

  it('Event', () => {
    expect(CustomEvent).toBeDefined();
    expect(Event).toBeDefined();
    expect(KeyboardEvent).toBeDefined();
    expect(MouseEvent).toBeDefined();
  });

  it('Fetch', () => {
    expect(Request).toBeDefined();
    expect(Response).toBeDefined();
  });

  it('Parse', () => {
    expect(DOMParser).toBeDefined();
  });
});

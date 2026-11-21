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

  it('Blob', async () => {
    const blob = new Blob(['hello'], { type: 'TEXT/PLAIN' });

    expect(Blob).toBeDefined();
    expect(blob.size).toBe(5);
    expect(blob.type).toBe('text/plain');
    expect(await blob.text()).toBe('hello');
    expect(Object.prototype.toString.call(blob)).toBe('[object Blob]');
  });

  it('File', () => {
    const file = new File(['whatever'], 'myFile.png', {
      lastModified: 123,
      type: 'image/png',
    });

    expect(File).toBeDefined();
    expect(file).toBeInstanceOf(Blob);
    expect(file.name).toBe('myFile.png');
    expect(file.type).toBe('image/png');
    expect(file.size).toBe(8);
    expect(file.lastModified).toBe(123);
    expect(file.webkitRelativePath).toBe('');
    expect(Object.prototype.toString.call(file)).toBe('[object File]');
  });

  it('Parse', () => {
    expect(DOMParser).toBeDefined();
  });
});

import { getHmrHref, updateCssUrlValue } from '../hmr-util';

describe('updateCssUrlValue', () => {
  const versionId = '1234';

  it('should update url w/ existing qs', () => {
    const fileName = 'img.png';
    const css = `background-image: url('img.png?what=ever&s-hmr=4321')`;

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe(`background-image: url('img.png?what=ever&s-hmr=1234')`);
  });

  it('should update url w/ single quotes', () => {
    const fileName = 'img.png';
    const css = `background: url('img.png')`;

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe(`background: url('img.png?s-hmr=1234')`);
  });

  it('should update url w/ double quotes', () => {
    const fileName = 'img.png';
    const css = 'background: url("img.png")';

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe('background: url("img.png?s-hmr=1234")');
  });

  it('should update url w/ no quotes', () => {
    const fileName = 'img.png';
    const css = 'background: url(img.png)';

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe('background: url(img.png?s-hmr=1234)');
  });

  it('should not update for different file', () => {
    const fileName = 'img.png';
    const css = 'background: url(hello.png)';

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe('background: url(hello.png)');
  });

  it('should not get url', () => {
    const fileName = 'img.png';
    const css = 'background: red';

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe('background: red');
  });
});

describe('updateHmrUrl', () => {
  const versionId = '1234';

  it('update existing qs', () => {
    const fileName = 'file-a.css';
    const oldHref = './file-a.css?s-hmr=4321&what=ever';

    const newHref = getHmrHref(versionId, fileName, oldHref);

    expect(newHref).toBe('./file-a.css?s-hmr=1234&what=ever');
  });

  it('add to existing qs', () => {
    const fileName = 'file-a.css';
    const oldHref = './file-a.css?what=ever';

    const newHref = getHmrHref(versionId, fileName, oldHref);

    expect(newHref).toBe('./file-a.css?what=ever&s-hmr=1234');
  });

  it('update no prefix . or / relative href', () => {
    const fileName = 'file-a.css';
    const oldHref = 'file-a.css';

    const newHref = getHmrHref(versionId, fileName, oldHref);

    expect(newHref).toBe('file-a.css?s-hmr=1234');
  });

  it('update exact href', () => {
    const fileName = 'file-a.css';
    const oldHref = '/build/file-a.css';

    const newHref = getHmrHref(versionId, fileName, oldHref);

    expect(newHref).toBe('/build/file-a.css?s-hmr=1234');
  });

  it('not matching file name', () => {
    const fileName = 'file-a.css';
    const oldHref = '/build/file-b.css';

    const newHref = getHmrHref(versionId, fileName, oldHref);

    expect(newHref).toBe('/build/file-b.css');
  });
});

import { styles } from '@platform';

import { appendStyleSourceMap, registerStyle } from '../styles';

describe('style source maps', () => {
  afterEach(() => styles.delete('source-map-test'));

  it('retains the CSS source map when registering a non-constructable style', () => {
    registerStyle('source-map-test', '.button{color:red}', false, 'data:application/json;base64,AAAA');

    expect(styles.get('source-map-test')).toBe(
      '.button{color:red}\n/*# sourceMappingURL=data:application/json;base64,AAAA */',
    );
  });

  it('keeps each external style and its source map separate', () => {
    registerStyle('source-map-test', ['.first{color:red}', '.second{color:blue}'], false, [
      'https://cdn.example.com/first.css.map',
      'https://cdn.example.com/second.css.map',
    ]);

    expect(styles.get('source-map-test')).toEqual([
      '.first{color:red}\n/*# sourceMappingURL=https://cdn.example.com/first.css.map */',
      '.second{color:blue}\n/*# sourceMappingURL=https://cdn.example.com/second.css.map */',
    ]);
  });

  it('flattens imported style entries before registering their source maps', () => {
    registerStyle('source-map-test', [['.imported{color:green}', '.local{color:red}'], '.second{color:blue}'], false, [
      ['imported.css.map', 'local.css.map'],
      'second.css.map',
    ]);

    expect(styles.get('source-map-test')).toEqual([
      '.imported{color:green}\n/*# sourceMappingURL=imported.css.map */',
      '.local{color:red}\n/*# sourceMappingURL=local.css.map */',
      '.second{color:blue}\n/*# sourceMappingURL=second.css.map */',
    ]);
  });

  it('adds a CSS source-map annotation to runtime style text', () => {
    expect(appendStyleSourceMap('.button{color:red}', 'data:application/json;base64,AAAA')).toBe(
      '.button{color:red}\n/*# sourceMappingURL=data:application/json;base64,AAAA */',
    );
  });

  it('does not add an annotation when CSS source maps are disabled', () => {
    expect(appendStyleSourceMap('.button{color:red}', undefined)).toBe('.button{color:red}');
  });

  it('preserves an existing source-map annotation when no replacement map is provided', () => {
    const style = '.button{color:red}\n/*# sourceMappingURL=styles.css.map */';
    expect(appendStyleSourceMap(style, undefined)).toBe(style);
  });

  it('does not duplicate a source-map annotation during HMR updates', () => {
    const style = '.button{color:red}\n/*# sourceMappingURL=data:application/json;base64,AAAA */';
    expect(appendStyleSourceMap(style, 'data:application/json;base64,BBBB')).toBe(
      '.button{color:red}\n/*# sourceMappingURL=data:application/json;base64,BBBB */',
    );
  });

  it('combines source maps for concatenated CSS styles into one index map', () => {
    const firstMap = JSON.stringify({ version: 3, sources: ['first.scss'], names: [], mappings: 'AAAA' });
    const secondMap = JSON.stringify({ version: 3, sources: ['second.scss'], names: [], mappings: 'AAAA' });
    const firstMapUrl = `data:application/json;base64,${Buffer.from(firstMap).toString('base64')}`;
    const secondMapUrl = `data:application/json;base64,${Buffer.from(secondMap).toString('base64')}`;

    const output = appendStyleSourceMap('abcde', [
      { map: firstMapUrl, length: 3 },
      { map: secondMapUrl, length: 2 },
    ]);
    const sourceMapUrl = output.match(/sourceMappingURL=(.*?) \*\//)?.[1];

    expect(sourceMapUrl).toContain('data:application/json,');
    const sourceMap = JSON.parse(decodeURIComponent(sourceMapUrl!.split(',')[1]));
    expect(sourceMap.sections).toEqual([
      expect.objectContaining({ offset: { line: 0, column: 0 } }),
      expect.objectContaining({ offset: { line: 0, column: 3 } }),
    ]);
  });
});

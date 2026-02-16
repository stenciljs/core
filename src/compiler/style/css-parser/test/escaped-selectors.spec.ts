import { parseCss } from '../parse-css';
import { serializeCss } from '../serialize-css';

describe('Escaped CSS Selectors', () => {
  it('should parse selectors with escaped brackets (Tailwind-style)', () => {
    const css = `
      .min-width-\\[150px\\] {
        min-width: 150px;
      }
    `;

    const result = parseCss(css);
    console.log('Diagnostics:', result.diagnostics);

    expect(result.diagnostics).toHaveLength(0);

    const serialized = serializeCss(result.stylesheet, {});
    expect(serialized).toContain('min-width-\\[150px\\]');
    expect(serialized).toContain('min-width:150px');
  });

  it('should parse nested rules with escaped brackets', () => {
    const css = `
      django-hstore-widget {
        .min-width-\\[150px\\] {
          min-width: 150px;
        }
        .min-width-\\[300px\\] {
          min-width: 300px;
        }
      }
    `;

    const result = parseCss(css);
    console.log('Nested diagnostics:', result.diagnostics);

    expect(result.diagnostics).toHaveLength(0);
  });

  it('should parse element selector with nested rules', () => {
    const css = `
      button {
        all: unset;
      }
    `;

    const result = parseCss(css);
    console.log('Button alone:', JSON.stringify(result.diagnostics, null, 2));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should parse custom element with button', () => {
    const css = `django-hstore-widget {
  button {
    all: unset;
  }
}`;

    const result = parseCss(css);
    console.log('Custom element with button:', JSON.stringify(result.diagnostics, null, 2));
    if (result.diagnostics.length > 0) {
      console.log('Stylesheet:', JSON.stringify(result.stylesheet, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should parse custom element with button and comment', () => {
    const css = `
      django-hstore-widget {
        button {
          all: unset;
        }
        /* Comment */
        .flex {
          display: flex;
        }
      }
    `;

    const result = parseCss(css);
    console.log('With comment after button:', JSON.stringify(result.diagnostics, null, 2));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('should parse nested rules with comments between them', () => {
    const css = `
      django-hstore-widget {
        button {
          all: unset;
        }

        /* Comment here */
        .flex {
          display: flex;
        }
      }
    `;

    const result = parseCss(css);
    console.log('With comments:', JSON.stringify(result.diagnostics, null, 2));

    expect(result.diagnostics).toHaveLength(0);
  });

  it('should parse the full user CSS', () => {
    const css = `django-hstore-widget {
    button {
        all: unset;
    }

    /* Arbitrary min-width */
    .min-width-\\[150px\\] {
        min-width: 150px;
    }

    .min-width-\\[300px\\] {
        min-width: 300px;
    }

    .flex {
        display: flex;
    }
}`;

    const result = parseCss(css);
    console.log('Full CSS diagnostics:', JSON.stringify(result.diagnostics, null, 2));

    expect(result.diagnostics).toHaveLength(0);
  });
});

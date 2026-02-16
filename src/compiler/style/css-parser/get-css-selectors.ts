export const getCssSelectors = (sel: string) => {
  // reusing global SELECTORS since this is a synchronous operation
  SELECTORS.all.length =
    SELECTORS.tags.length =
    SELECTORS.classNames.length =
    SELECTORS.ids.length =
    SELECTORS.attrs.length =
      0;

  sel = sel
    .replace(/\./g, ' .')
    .replace(/\#/g, ' #')
    .replace(/\[/g, ' [')
    .replace(/\>/g, ' > ')
    .replace(/\+/g, ' + ')
    .replace(/\~/g, ' ~ ')
    .replace(/\*/g, ' * ')
    .replace(/\:not\((.*?)\)/g, ' ');

  const items = sel.split(' ');

  for (let i = 0, l = items.length; i < l; i++) {
    items[i] = items[i].split(':')[0];

    if (items[i].length === 0) continue;

    if (items[i].charAt(0) === '.') {
      SELECTORS.classNames.push(items[i].slice(1));
    } else if (items[i].charAt(0) === '#') {
      SELECTORS.ids.push(items[i].slice(1));
    } else if (items[i].charAt(0) === '[') {
      items[i] = items[i].slice(1).split('=')[0].split(']')[0].trim();
      SELECTORS.attrs.push(items[i].toLowerCase());
    } else if (/[a-z]/g.test(items[i].charAt(0))) {
      SELECTORS.tags.push(items[i].toLowerCase());
    }
  }

  SELECTORS.classNames = SELECTORS.classNames.sort((a, b) => {
    if (a.length < b.length) return -1;
    if (a.length > b.length) return 1;
    return 0;
  });

  return SELECTORS;
};

const SELECTORS: { all: string[]; tags: string[]; classNames: string[]; ids: string[]; attrs: string[] } = {
  all: [],
  tags: [],
  classNames: [],
  ids: [],
  attrs: [],
};

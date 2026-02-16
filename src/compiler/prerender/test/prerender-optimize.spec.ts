import { getAttrUrls, setAttrUrls } from '../prerender-optimize';

describe('prerender optimize', () => {
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/srcset

  it('getAttrUrls srcset', () => {
    const s1 = getAttrUrls('srcset', 'images/team-photo.jpg 1x, images/team-photo-full 2048w');
    expect(s1).toEqual([
      {
        src: 'images/team-photo.jpg',
        descriptor: '1x',
      },
      {
        src: 'images/team-photo-full',
        descriptor: '2048w',
      },
    ]);

    const s2 = getAttrUrls('SRCSET', 'header640.png 640w, header.png');
    expect(s2).toEqual([
      {
        src: 'header640.png',
        descriptor: '640w',
      },
      {
        src: 'header.png',
      },
    ]);
  });

  it('getAttrUrls src', () => {
    const s1 = getAttrUrls('src', 'images/team-photo.jpg');
    expect(s1).toEqual([
      {
        src: 'images/team-photo.jpg',
      },
    ]);
  });

  it('setAttrUrls src', () => {
    const url = new URL('https://stenciljs.com/assets/image.png');
    const s1 = setAttrUrls(url, undefined);
    expect(s1).toEqual('/assets/image.png');
  });

  it('setAttrUrls src w/ descriptor', () => {
    const url = new URL('https://stenciljs.com/assets/image.png?v=123');
    const s1 = setAttrUrls(url, '640w');
    expect(s1).toEqual('/assets/image.png?v=123 640w');
  });
});

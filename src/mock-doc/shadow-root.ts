import { MockDocumentFragment } from './document-fragment';

export class MockShadowRoot extends MockDocumentFragment {
  get activeElement(): HTMLElement | null {
    return null;
  }

  get cloneable(): boolean {
    return false;
  }

  get delegatesFocus(): boolean {
    return false;
  }

  get fullscreenElement(): HTMLElement | null {
    return null;
  }

  get host(): HTMLElement | null {
    let parent = this.parentElement();
    while (parent) {
      if (parent.nodeType === 11) {
        return parent;
      }
      parent = parent.parentElement();
    }
    return null;
  }

  get mode(): 'open' | 'closed' {
    return 'open';
  }

  get pictureInPictureElement(): HTMLElement | null {
    return null;
  }

  get pointerLockElement(): HTMLElement | null {
    return null;
  }

  get serializable(): boolean {
    return false;
  }

  get slotAssignment(): 'named' | 'manual' {
    return 'named';
  }

  get styleSheets(): StyleSheet[] {
    return [];
  }
}

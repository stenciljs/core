import { MockDocumentFragment } from './document-fragment';

export class MockShadowRoot extends MockDocumentFragment {
  private _mode: 'open' | 'closed' = 'open';
  private _delegatesFocus: boolean = false;

  get activeElement(): HTMLElement | null {
    return null;
  }

  get cloneable(): boolean {
    return false;
  }

  get delegatesFocus(): boolean {
    return this._delegatesFocus;
  }

  set delegatesFocus(value: boolean) {
    this._delegatesFocus = value;
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
    return this._mode;
  }

  set mode(value: 'open' | 'closed') {
    this._mode = value;
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

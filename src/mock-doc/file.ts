const NativeBlob = typeof Blob === 'function' ? Blob : null;

class MockBlob {
  readonly size: number;
  readonly type: string;

  constructor(blobParts: BlobPart[] = [], options: BlobPropertyBag = {}) {
    this.size = blobParts.reduce((total, part) => {
      if (typeof part === 'string') {
        return total + part.length;
      }
      if (part instanceof ArrayBuffer) {
        return total + part.byteLength;
      }
      if (ArrayBuffer.isView(part)) {
        return total + part.byteLength;
      }
      return total + ((part as Blob).size ?? 0);
    }, 0);
    this.type = options.type?.toLowerCase() ?? '';
  }

  async arrayBuffer() {
    return new ArrayBuffer(0);
  }

  slice() {
    return new MockBlob([], { type: this.type });
  }

  async text() {
    return '';
  }
}

const BlobBase = NativeBlob ?? MockBlob;

export class MockFile extends BlobBase {
  readonly lastModified: number;
  readonly name: string;
  readonly webkitRelativePath = '';

  constructor(fileBits: BlobPart[] = [], fileName = '', options: FilePropertyBag = {}) {
    super(fileBits, options);
    this.name = String(fileName);
    this.lastModified = options.lastModified ?? Date.now();
  }

  get [Symbol.toStringTag]() {
    return 'File';
  }
}

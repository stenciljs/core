export class MockBlob implements Blob {
  private readonly blobParts: BlobPart[];

  readonly size: number;
  readonly type: string;

  constructor(blobParts: BlobPart[] = [], options: BlobPropertyBag = {}) {
    this.blobParts = blobParts;
    this.size = blobParts.reduce((total, part) => total + getBlobPartSize(part), 0);
    this.type = options.type ? String(options.type).toLowerCase() : '';
  }

  async arrayBuffer() {
    return new ArrayBuffer(this.size);
  }

  async bytes() {
    return new Uint8Array(this.size);
  }

  slice(start = 0, end = this.size, contentType = '') {
    const relativeStart = start < 0 ? Math.max(this.size + start, 0) : Math.min(start, this.size);
    const relativeEnd = end < 0 ? Math.max(this.size + end, 0) : Math.min(end, this.size);
    const span = Math.max(relativeEnd - relativeStart, 0);

    return new MockBlob([new Uint8Array(span)], { type: contentType });
  }

  stream() {
    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        controller.enqueue(new Uint8Array(this.size));
        controller.close();
      },
    });
  }

  async text() {
    return this.blobParts.map((part) => (typeof part === 'string' ? part : '')).join('');
  }

  get [Symbol.toStringTag]() {
    return 'Blob';
  }
}

const getBlobPartSize = (part: BlobPart) => {
  if (typeof part === 'string') {
    return globalThis.TextEncoder ? new TextEncoder().encode(part).byteLength : part.length;
  }

  if (part instanceof ArrayBuffer) {
    return part.byteLength;
  }

  if (ArrayBuffer.isView(part)) {
    return part.byteLength;
  }

  return part.size;
};

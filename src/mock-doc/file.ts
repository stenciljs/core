import { MockBlob } from './blob';

export class MockFile extends MockBlob implements File {
  readonly lastModified: number;
  readonly name: string;
  readonly webkitRelativePath = '';

  constructor(fileBits: BlobPart[] = [], fileName = '', options: FilePropertyBag = {}) {
    super(fileBits, options);

    this.name = String(fileName);
    this.lastModified = options.lastModified ?? Date.now();
  }

  override get [Symbol.toStringTag]() {
    return 'File';
  }
}

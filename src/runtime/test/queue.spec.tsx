import { Component, Method, readTask, writeTask } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('queue', () => {
  it('should execute tasks in the right order', async () => {
    let log = '';
    @Component({
      tag: 'cmp-a',
    })
    class CmpA {
      @Method()
      doQueue() {
        writeTask(() => (log += ' write1'));
        readTask(() => (log += ' read1'));
        readTask(() => (log += ' read2'));
        writeTask(() => (log += ' write2'));
        readTask(() => (log += ' read3'));
      }
    }
    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    await root.doQueue();
    expect(log).toEqual('');

    await waitForChanges();

    expect(log).toEqual(' read1 read2 read3 write1 write2');
  });
});

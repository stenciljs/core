import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('attribute-complex', () => {
  it('should cast attributes', async () => {
    const { root, waitForChanges } = await render(<attribute-complex />, { waitForReady: false });
    await waitForExist('attribute-complex.hydrated');

    root.setAttribute('nu-0', '3');
    root.setAttribute('nu-1', '-2.3');
    (root as any).nu2 = '123';

    root.setAttribute('bool-0', 'false');
    root.setAttribute('bool-1', 'true');
    root.setAttribute('bool-2', '');

    root.setAttribute('str-0', 'false');
    root.setAttribute('str-1', '123');
    (root as any).str2 = 321;

    root.setAttribute('obj', 'James Pond RoboCod');
    await waitForChanges();

    const instance = await (root as any).getInstance();
    expect(instance.nu0).toBe(3);
    expect(instance.nu1).toBe(-2.3);
    expect(instance.nu2).toBe(123);

    expect(instance.bool0).toBe(false);
    expect(instance.bool1).toBe(true);
    expect(instance.bool2).toBe(true);

    expect(instance.str0).toBe('false');
    expect(instance.str1).toBe('123');
    expect(instance.str2).toBe('321');

    expect(instance.obj).toBe('{"name":"James Pond RoboCod"}');
  });

  it('should cast element props', async () => {
    const { root, waitForChanges } = await render(<attribute-complex />, { waitForReady: false });
    await waitForExist('attribute-complex.hydrated');

    const instance = await (root as any).getInstance();

    (root as any).nu0 = '1234';
    (root as any).nu1 = '-111.1';

    (root as any).bool0 = 'true';
    (root as any).bool1 = 'false';
    (root as any).bool2 = false;

    (root as any).obj = 'James Pond RoboCod';
    await waitForChanges();

    expect(instance.nu0).toBe(1234);
    expect(instance.nu1).toBe(-111.1);

    expect(instance.bool0).toBe(true);
    expect(instance.bool1).toBe(false);
    expect(instance.bool2).toBe(false);

    expect(instance.str0).toBe('hello'); // default value
    expect(instance.obj).toBe('{"name":"James Pond RoboCod"}');
  });
});

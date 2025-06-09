import { mockCompilerSystem } from '@stencil/core/testing';

import { createSystem } from '../../compiler/sys/stencil-sys';
import { defaultConfig, readConfig, updateConfig, writeConfig } from '../ionic-config';
import { UUID_REGEX } from '../telemetry/helpers';

const UUID1 = '5588e0f0-02b5-4afa-8194-5d8f78683b36';
const UUID2 = 'e5609819-5c24-4fa2-8817-e05ca10b8cae';

describe('readConfig', () => {
  const sys = mockCompilerSystem();

  beforeEach(async () => {
    await sys.removeFile(defaultConfig(sys));
  });

  it('should create a file if it does not exist', async () => {
    const result = await sys.stat(defaultConfig(sys));

    // expect the file to have been deleted by the test setup
    expect(result.isFile).toBe(false);

    const config = await readConfig(sys);

    expect(Object.keys(config).join()).toBe('tokens.telemetry,telemetry.stencil');
  });

  it("should fix the telemetry token if it's a string, but an invalid UUID", async () => {
    await writeConfig(sys, { 'telemetry.stencil': true, 'tokens.telemetry': 'aaaa' });

    const result = await sys.stat(defaultConfig(sys));

    expect(result.isFile).toBe(true);

    const config = await readConfig(sys);

    expect(Object.keys(config).join()).toBe('telemetry.stencil,tokens.telemetry');
    expect(config['telemetry.stencil']).toBe(true);
    expect(config['tokens.telemetry']).toMatch(UUID_REGEX);
  });

  it('handles a non-string telemetry token', async () => {
    // our typings state that `tokens.telemetry` is of type `string | undefined`, but technically this value could be
    // anything. use `undefined` to make the typings happy (this should cover all non-string telemetry tokens). the
    // important thing here is that the value is _not_ a string for this test!
    await writeConfig(sys, { 'telemetry.stencil': true, 'tokens.telemetry': undefined });

    const config = await readConfig(sys);

    expect(Object.keys(config).join()).toBe('telemetry.stencil,tokens.telemetry');
    expect(config['telemetry.stencil']).toBe(true);
    expect(config['tokens.telemetry']).toMatch(UUID_REGEX);
  });

  it('handles a non-existent telemetry token', async () => {
    await writeConfig(sys, { 'telemetry.stencil': true });

    const config = await readConfig(sys);

    expect(Object.keys(config).join()).toBe('telemetry.stencil,tokens.telemetry');
    expect(config['telemetry.stencil']).toBe(true);
    expect(config['tokens.telemetry']).toMatch(UUID_REGEX);
  });

  it('should read a file if it exists', async () => {
    await writeConfig(sys, { 'telemetry.stencil': true, 'tokens.telemetry': UUID1 });

    const result = await sys.stat(defaultConfig(sys));

    expect(result.isFile).toBe(true);

    const config = await readConfig(sys);

    expect(Object.keys(config).join()).toBe('telemetry.stencil,tokens.telemetry');
    expect(config['telemetry.stencil']).toBe(true);
    expect(config['tokens.telemetry']).toBe(UUID1);
  });
});

describe('updateConfig', () => {
  const sys = createSystem();

  it('should edit a file', async () => {
    await writeConfig(sys, { 'telemetry.stencil': true, 'tokens.telemetry': UUID1 });

    const result = await sys.stat(defaultConfig(sys));

    expect(result.isFile).toBe(true);

    const configPre = await readConfig(sys);

    expect(typeof configPre).toBe('object');
    expect(Object.keys(configPre).join()).toBe('telemetry.stencil,tokens.telemetry');
    expect(configPre['telemetry.stencil']).toBe(true);
    expect(configPre['tokens.telemetry']).toBe(UUID1);

    await updateConfig(sys, { 'telemetry.stencil': false, 'tokens.telemetry': UUID2 });

    const configPost = await readConfig(sys);

    expect(typeof configPost).toBe('object');
    // Should keep the previous order
    expect(Object.keys(configPost).join()).toBe('telemetry.stencil,tokens.telemetry');
    expect(configPost['telemetry.stencil']).toBe(false);
    expect(configPost['tokens.telemetry']).toBe(UUID2);
  });
});

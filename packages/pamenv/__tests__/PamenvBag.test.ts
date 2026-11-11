import { afterEach, describe, expect, it } from 'vitest';
import { PamenvBag } from '../src/impls/PamenvBag';

describe('PamenvBag', () => {
  afterEach(() => {
    delete process.env.PAMENV_BAG_A;
    delete process.env.PAMENV_BAG_B;
  });

  it('get / has 读冻结表', () => {
    const bag = new PamenvBag({ PAMENV_BAG_A: 'a', PAMENV_BAG_B: '' });
    expect(bag.get('PAMENV_BAG_A')).toBe('a');
    expect(bag.get('PAMENV_BAG_B')).toBe('');
    expect(bag.get('MISSING')).toBeUndefined();
    expect(bag.has('PAMENV_BAG_A')).toBe(true);
    expect(bag.has('PAMENV_BAG_B')).toBe(true);
    expect(bag.has('MISSING')).toBe(false);
    expect(Object.isFrozen(bag.values)).toBe(true);
  });

  it('applyToProcessEnv 默认覆盖，keepEnv 保留已有', () => {
    process.env.PAMENV_BAG_A = 'keep-me';
    const bag = new PamenvBag({
      PAMENV_BAG_A: 'from-bag',
      PAMENV_BAG_B: 'b'
    });

    bag.applyToProcessEnv({ keepEnv: ['PAMENV_BAG_A'] });
    expect(process.env.PAMENV_BAG_A).toBe('keep-me');
    expect(process.env.PAMENV_BAG_B).toBe('b');

    bag.applyToProcessEnv();
    expect(process.env.PAMENV_BAG_A).toBe('from-bag');
  });
});

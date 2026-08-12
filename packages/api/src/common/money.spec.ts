import { toKopecks, fromKopecks, assertKopecks, isKopecks } from './money';

describe('money (копейки)', () => {
  it('переводит рубли в целые копейки без ошибок округления', () => {
    expect(toKopecks(0.1)).toBe(10);
    expect(toKopecks(1000)).toBe(100000);
    expect(toKopecks(99.99)).toBe(9999);
    expect(toKopecks(0.015)).toBe(2);
  });

  it('обратно в рубли', () => {
    expect(fromKopecks(100000)).toBe(1000);
    expect(fromKopecks(9999)).toBe(99.99);
  });

  it('принимает только целые неотрицательные копейки', () => {
    expect(isKopecks(100)).toBe(true);
    expect(isKopecks(-5)).toBe(false);
    expect(isKopecks(0.5)).toBe(false);
  });

  it('бракует некорректные значения', () => {
    expect(() => assertKopecks(-1, 'income')).toThrow();
    expect(() => assertKopecks(10.5, 'amount')).toThrow();
    expect(() => assertKopecks(123, 'ok')).not.toThrow();
  });
});
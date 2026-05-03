import { formatWeight } from '@/utils/formatWeight';

describe('formatWeight', () => {
  it('kg identity', () => expect(formatWeight(80, 'kg')).toBe('80 kg'));
  it('converts to lbs', () => expect(formatWeight(80, 'lbs')).toBe('176.4 lbs'));
  it('zero kg', () => expect(formatWeight(0, 'kg')).toBe('0 kg'));
});

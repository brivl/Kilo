import { getInitials } from '@/utils/initials';

describe('getInitials', () => {
  it('returns first letters of first and last name', () => {
    expect(getInitials('Jane Doe', undefined)).toBe('JD');
  });

  it('returns single letter for one-word name', () => {
    expect(getInitials('Jane', undefined)).toBe('J');
  });

  it('falls back to first letter of email when no name', () => {
    expect(getInitials(undefined, 'test@example.com')).toBe('T');
  });

  it('returns ? when both name and email are undefined', () => {
    expect(getInitials(undefined, undefined)).toBe('?');
  });

  it('handles multi-part names using first two words only', () => {
    expect(getInitials('Jane Mary Doe', undefined)).toBe('JM');
  });
});

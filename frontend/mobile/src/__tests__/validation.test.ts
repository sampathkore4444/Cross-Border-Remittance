import { validatePhone, validateOTP, validateAmount, validateName, normalizePhone } from '../utils/validation';

describe('validatePhone', () => {
  it('returns null for valid Lao phone', () => {
    expect(validatePhone('2055551234', '856')).toBeNull();
    expect(validatePhone('2098765432', '856')).toBeNull();
  });

  it('returns null for valid Thai phone', () => {
    expect(validatePhone('8123456789', '66')).toBeNull();
    expect(validatePhone('6123456789', '66')).toBeNull();
  });

  it('returns error for empty phone', () => {
    expect(validatePhone('', '856')).toBe('validation.phoneRequired');
    expect(validatePhone('  ', '856')).toBe('validation.phoneRequired');
  });

  it('returns error for invalid Lao phone', () => {
    expect(validatePhone('12345', '856')).toBe('validation.phoneInvalid');
    expect(validatePhone('205555', '856')).toBe('validation.phoneInvalid');
  });

  it('returns error for invalid Thai phone', () => {
    expect(validatePhone('123', '66')).toBe('validation.phoneInvalid');
  });
});

describe('validateOTP', () => {
  it('returns null for valid 6-digit code', () => {
    expect(validateOTP('123456')).toBeNull();
    expect(validateOTP('000000')).toBeNull();
  });

  it('returns error for invalid OTP', () => {
    expect(validateOTP('')).toBe('validation.otpInvalid');
    expect(validateOTP('12345')).toBe('validation.otpInvalid');
    expect(validateOTP('1234567')).toBe('validation.otpInvalid');
    expect(validateOTP('abc123')).toBe('validation.otpInvalid');
  });
});

describe('validateAmount', () => {
  it('returns null for valid amount', () => {
    expect(validateAmount(100)).toBeNull();
    expect(validateAmount(5000)).toBeNull();
    expect(validateAmount(50000)).toBeNull();
  });

  it('returns error for amount below minimum', () => {
    expect(validateAmount(0)).toBe('validation.amountMin');
    expect(validateAmount(50)).toBe('validation.amountMin');
  });

  it('returns error for amount above maximum', () => {
    expect(validateAmount(50001)).toBe('validation.amountMax');
    expect(validateAmount(999999)).toBe('validation.amountMax');
  });
});

describe('validateName', () => {
  it('returns null for valid name', () => {
    expect(validateName('Mae Khammany')).toBeNull();
    expect(validateName('Souliphone')).toBeNull();
  });

  it('returns error for empty or short name', () => {
    expect(validateName('')).toBe('validation.nameRequired');
    expect(validateName('  ')).toBe('validation.nameRequired');
    expect(validateName('A')).toBe('validation.nameRequired');
  });
});

describe('normalizePhone', () => {
  it('prepends country code and strips leading zero', () => {
    expect(normalizePhone('02055551234', '856')).toBe('8562055551234');
    expect(normalizePhone('2055551234', '856')).toBe('8562055551234');
    expect(normalizePhone('0812345678', '66')).toBe('66812345678');
  });
});

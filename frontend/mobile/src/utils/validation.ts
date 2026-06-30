export function validatePhone(phone: string, countryCode: string): string | null {
  if (!phone.trim()) return 'validation.phoneRequired';
  const cleaned = phone.replace(/^0/, '');
  if (countryCode === '856' && !/^20\d{8,9}$/.test(cleaned)) return 'validation.phoneInvalid';
  if (countryCode === '66' && !/^[1-9]\d{8}$/.test(cleaned)) return 'validation.phoneInvalid';
  if (!['856', '66'].includes(countryCode) && cleaned.length < 6) return 'validation.phoneInvalid';
  return null;
}

export function validateOTP(otp: string): string | null {
  if (!otp || otp.length !== 6) return 'validation.otpInvalid';
  if (!/^\d{6}$/.test(otp)) return 'validation.otpInvalid';
  return null;
}

export function validateAmount(amount: number, min = 100, max = 50000): string | null {
  if (amount <= 0) return 'validation.amountMin';
  if (amount < min) return 'validation.amountMin';
  if (amount > max) return 'validation.amountMax';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'validation.nameRequired';
  if (name.trim().length < 2) return 'validation.nameRequired';
  return null;
}

export function normalizePhone(phone: string, countryCode: string): string {
  return `${countryCode}${phone.replace(/^0/, '')}`;
}

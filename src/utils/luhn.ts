/**
 * Luhn check-digit validation (a.k.a. "mod 10" algorithm).
 * Reference: H. P. Luhn, "Computer for Verifying Numbers,"
 * U.S. Patent 2,950,048, 1960.
 *
 * Used in PaymentScreen to validate the mock card number before
 * accepting the kapora deposit.
 */

export function isValidLuhn(rawCardNumber: string): boolean {
  // Strip spaces/dashes the user might have typed.
  const digits = rawCardNumber.replace(/[\s-]/g, '');

  // Basic shape check first (covers the old length===16 rule too).
  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  // Walk the digits from right to left.
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9; // same as summing the two digits
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}
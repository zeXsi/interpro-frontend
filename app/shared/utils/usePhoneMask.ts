import type { ChangeEvent, KeyboardEvent } from 'react';

function normalizePhoneDigits(str: string): string {
  let digits = str.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  else if (digits.startsWith('9') && digits.length <= 10) digits = '7' + digits;
  else if (digits.length && !digits.startsWith('7')) digits = '7' + digits;
  return digits.slice(0, 11);
}

function formatPhoneDisplay(digits: string): string {
  if (!digits) return '';
  const rest = digits.startsWith('7') ? digits.slice(1) : digits;
  if (rest.length <= 3) return `+7 (${rest}`;
  if (rest.length <= 6) return `+7 (${rest.slice(0, 3)}) ${rest.slice(3)}`;
  if (rest.length <= 8) return `+7 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6)}`;
  return `+7 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6, 8)}-${rest.slice(8, 10)}`;
}

function getDigitIndexToRemove(formatted: string, cursorPos: number, forBackspace: boolean): number {
  let digitIndex = -1;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      digitIndex++;
      if (forBackspace && i >= cursorPos) return digitIndex > 0 ? digitIndex - 1 : -1;
      if (!forBackspace && i >= cursorPos) return digitIndex;
    }
  }
  return forBackspace ? digitIndex : -1;
}

export const isValidRuPhone = (value: string) => /^7\d{10}$/.test(String(value ?? '').replace(/\D/g, ''));
export const phoneErrorMessage = 'Введите полный номер в формате +7 (XXX) XXX-XX-XX';

export function usePhoneMask(digits: string, onChange: (value: string) => void) {
  const formatted = formatPhoneDisplay(digits);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(normalizePhoneDigits(event.target.value));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const cursorPos = event.currentTarget.selectionStart ?? 0;
    const charToDelete =
      event.key === 'Backspace'
        ? formatted[cursorPos - 1]
        : event.key === 'Delete'
          ? formatted[cursorPos]
          : null;

    // Remove the adjacent digit when the cursor is next to mask punctuation.
    if (charToDelete && !/\d/.test(charToDelete)) {
      event.preventDefault();
      const index = getDigitIndexToRemove(formatted, cursorPos, event.key === 'Backspace');
      if (index >= 0) {
        const nextDigits = digits.split('');
        nextDigits.splice(index, 1);
        onChange(nextDigits.join(''));
      }
    }
  };

  return { formatted, handleChange, handleKeyDown };
}

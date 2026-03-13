export function decodeUnicodeEscapes(value?: string | null): string {
  if (!value) return '';

  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

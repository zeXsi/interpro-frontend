import { useCallback, useRef, useEffect } from 'react';

/**
 * Хук для дебаунсинга с передачей текущего, предыдущего значения и количества обновлений.
 * @param update - Функция, которая будет вызвана после задержки.
 * @param delay - Задержка в миллисекундах.
 * @returns Кортеж, содержащий:
 *   - debouncedUpdate: Дебаунсированная функция.
 *   - cancel: Функция для отмены запланированного вызова.
 *   - getUpdateCount: Функция для получения текущего счётчика обновлений.
 */
export function useDebouncedUpdate<T>(
  update: (current: T, previous: T | null, count: number) => void,
  delay: number
): [(value: T) => void, () => void, () => number] {
  const prevValueRef = useRef<T | null>(null);
  const updateCountRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedUpdate = useCallback((value: T) => {
    updateCountRef.current += 1;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      update(value, prevValueRef.current, updateCountRef.current);
      prevValueRef.current = value;
      updateCountRef.current = 0;
    }, delay);
  }, [delay, update]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      updateCountRef.current = 0;
    }
  }, []);

  const getUpdateCount = useCallback(() => updateCountRef.current, []);

  return [debouncedUpdate, cancel, getUpdateCount];
}

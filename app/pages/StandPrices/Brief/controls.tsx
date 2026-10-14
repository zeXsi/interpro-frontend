import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { DayPicker } from 'react-day-picker';
import { ru } from 'react-day-picker/locale';

import FileDocxIcon from 'assets/icons/brief/file-docx.svg?react';
import FilePdfIcon from 'assets/icons/brief/file-pdf.svg?react';
import FileRemoveIcon from 'assets/icons/brief/file-remove.svg?react';
import PlusIcon from 'assets/icons/brief/plus.svg?react';
import CheckmarkIcon from 'assets/icons/checkmark.svg?react';

import { AREA_MAX, AREA_MIN, BUDGETS, FILE_ACCEPT, FILE_EXTENSIONS, FILE_MAX_COUNT, FILE_MAX_SIZE, formatRub } from './data';

/* ---------- Поле с нижней линией ---------- */

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'decimal' | 'url';
  autoComplete?: string;
  error?: string;
  className?: string;
  /** Дописывается сразу за введённым значением, например «(м)». */
  suffix?: string;
}

export function Field({ label, value, onChange, type = 'text', inputMode, autoComplete, error, className = '', suffix }: FieldProps) {
  return (
    <label className={`Brief-field ${error ? 'isError' : ''} ${className}`}>
      {suffix && value && (
        // Невидимая копия значения сдвигает суффикс ровно за текст
        <span className="Brief-fieldSuffix" aria-hidden="true">
          <span>{value}</span> {suffix}
        </span>
      )}
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={label}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <span className="Brief-fieldError">{error}</span>}
    </label>
  );
}

/* ---------- Чекбокс ---------- */

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return (
    <label className="Brief-checkbox">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="Brief-checkboxBox" aria-hidden="true">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l2.667 2.667L9 1.333" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}

/* ---------- Согласие: квадратная галочка, как в форме обратной связи (ConsentCheckbox) ---------- */

interface ConsentProps {
  checked: boolean;
  error?: string;
  onChange: (value: boolean) => void;
  children: ReactNode;
}

export function Consent({ checked, error, onChange, children }: ConsentProps) {
  return (
    <div className={`Brief-consent ${checked ? 'isActive' : ''} ${error ? 'isError' : ''}`}>
      <label className="Brief-consentRow">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="Brief-consentBox" aria-hidden="true">
          <CheckmarkIcon />
        </span>
        <span className="Brief-consentText">{children}</span>
      </label>
      {error && <p className="Brief-consentError">{error}</p>}
    </div>
  );
}

/* ---------- Площадь: двойной слайдер ---------- */

export function AreaRange({ value, onChange }: { value: [number, number]; onChange: (value: [number, number]) => void }) {
  const [min, max] = value;
  const isDefault = min === AREA_MIN && max === AREA_MAX;
  // Когда ползунки совпали, сверху лежит «max». Если его тянут влево,
  // до конца жеста двигаем «min» — иначе ползунок упирается сам в себя.
  const isDraggingMin = useRef(false);

  useEffect(() => {
    const reset = () => (isDraggingMin.current = false);
    window.addEventListener('pointerup', reset);
    return () => window.removeEventListener('pointerup', reset);
  }, []);
  const toPercent = (area: number) => ((area - AREA_MIN) / (AREA_MAX - AREA_MIN)) * 100;

  return (
    <div className={`Brief-range ${isDefault ? 'isDefault' : ''}`}>
      <div
        className="Brief-rangeTrack"
        style={{ '--from': isDefault ? '0%' : `${toPercent(min)}%`, '--to': isDefault ? '0%' : `${toPercent(max)}%` } as React.CSSProperties}
      >
        <input
          type="range"
          min={AREA_MIN}
          max={AREA_MAX}
          value={min}
          aria-label="Минимальная площадь"
          onChange={(event) => onChange([Math.min(Number(event.target.value), max), max])}
        />
        <input
          type="range"
          min={AREA_MIN}
          max={AREA_MAX}
          value={max}
          aria-label="Максимальная площадь"
          onChange={(event) => {
            const next = Number(event.target.value);
            if (isDraggingMin.current || (min === max && next < min)) {
              isDraggingMin.current = true;
              onChange([Math.min(next, max), max]);
              return;
            }
            onChange([min, Math.max(next, min)]);
          }}
        />
      </div>
      <div className="Brief-rangeLabels">
        <span>от {min}&nbsp;м²</span>
        <span>до {max}&nbsp;м²</span>
      </div>
    </div>
  );
}

/* ---------- Бюджет: слайдер по фиксированным значениям ---------- */

export function BudgetRange({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: (value: number) => void }) {
  const lastIndex = BUDGETS.length - 1;

  return (
    <div className={`Brief-budget ${disabled ? 'isDisabled' : ''}`}>
      <div className="Brief-budgetTrack" style={{ '--value-ratio': value / lastIndex } as React.CSSProperties}>
        <div className="Brief-budgetTicks" aria-hidden="true">
          {BUDGETS.map((budget, index) => (
            <span key={budget} className={index <= value ? 'isActive' : ''} />
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={lastIndex}
          step={1}
          value={value}
          disabled={disabled}
          aria-label="Бюджет"
          aria-valuetext={formatRub(BUDGETS[value])}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <p className="Brief-budgetValue">
        {formatRub(BUDGETS[value])}
        {value === lastIndex && ' +'}
      </p>
    </div>
  );
}

/* ---------- Дата с календарём (react-day-picker — движок shadcn Calendar) ---------- */

const pad = (value: number) => String(value).padStart(2, '0');
export const formatDate = (date: Date) => `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${String(date.getFullYear()).slice(-2)}`;

function parseDate(value: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{2})$/);
  if (!match) return null;
  const date = new Date(2000 + Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return date.getDate() === Number(match[1]) ? date : null;
}

function maskDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)].filter(Boolean).join('.');
}

export function timeUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return '';
  if (days === 0) return 'Выставка сегодня';

  const plural = (n: number, forms: [string, string, string]) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
    return forms[2];
  };

  if (days < 14) return `До выставки ${days} ${plural(days, ['день', 'дня', 'дней'])}`;
  if (days < 61) {
    const weeks = Math.round(days / 7);
    return `До выставки ${weeks} ${plural(weeks, ['неделя', 'недели', 'недель'])}`;
  }
  const months = Math.round(days / 30.4);
  return `До выставки ${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])}`;
}

export function DateField({ value, onChange }: { value: Date | null; onChange: (value: Date | null) => void }) {
  const [text, setText] = useState(value ? formatDate(value) : '');
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(() => value ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [isOpen]);

  const today = new Date();

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const masked = maskDate(event.target.value);
    setText(masked);
    const date = parseDate(masked);
    onChange(date);
    if (date) setMonth(date);
  };

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(date);
    setText(formatDate(date));
    setIsOpen(false);
  };

  return (
    <div className="Brief-date" ref={rootRef}>
      <label className="Brief-field">
        <input
          type="text"
          inputMode="numeric"
          placeholder={isOpen ? 'дд.мм.гг' : 'Дата открытия выставки'}
          aria-label="Дата открытия выставки"
          value={text}
          onFocus={() => setIsOpen(true)}
          onChange={handleInput}
        />
      </label>
      {isOpen && (
        <div className="Brief-calendar">
          <DayPicker
            mode="single"
            locale={ru}
            captionLayout="dropdown"
            showOutsideDays
            month={month}
            onMonthChange={setMonth}
            selected={value ?? undefined}
            onSelect={handleSelect}
            startMonth={new Date(today.getFullYear(), 0)}
            endMonth={new Date(today.getFullYear() + 3, 11)}
            formatters={{ formatMonthDropdown: (date) => date.toLocaleString('ru-RU', { month: 'short' }) }}
            components={{ Chevron: CalendarChevron }}
          />
        </div>
      )}
    </div>
  );
}

/** Иконки lucide (ChevronLeft/Right/Down) — как в shadcn Calendar. */
function CalendarChevron({ orientation = 'down', className }: { orientation?: 'up' | 'down' | 'left' | 'right'; className?: string }) {
  const paths = { left: 'm15 18-6-6 6-6', right: 'm9 18 6-6-6-6', down: 'm6 9 6 6 6-6', up: 'm18 15-6-6-6 6' };
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[orientation]} />
    </svg>
  );
}

/* ---------- Файлы ---------- */

export function FileField({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    setError('');

    const accepted: File[] = [];
    for (const file of picked) {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!FILE_EXTENSIONS.includes(extension)) {
        setError('Недопустимый формат файла');
        continue;
      }
      if (file.size > FILE_MAX_SIZE) {
        setError('Максимальный размер файла 10мб');
        continue;
      }
      accepted.push(file);
    }
    // Лишние файлы сверх лимита отбрасываем с конца
    if (accepted.length) onChange([...files, ...accepted].slice(0, FILE_MAX_COUNT));
  };

  const isFull = files.length >= FILE_MAX_COUNT;

  return (
    <div className="Brief-files">
      <div className="Brief-filesHead">
        <button type="button" className="Brief-filesAdd" disabled={isFull} onClick={() => inputRef.current?.click()}>
          <span className="Brief-filesAddIcon" aria-hidden="true">
            <PlusIcon />
          </span>
          Прикрепить файл
        </button>
        {error && <span className="Brief-filesError">{error}</span>}
        <input ref={inputRef} type="file" multiple accept={FILE_ACCEPT} hidden onChange={addFiles} />
      </div>
      {files.length > 0 && (
        <ul className="Brief-filesList">
          {files.map((file, index) => (
            <FileItem key={`${file.name}-${index}`} file={file} onRemove={() => onChange(files.filter((_, i) => i !== index))} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FileItem({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState('');
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  const remove = (
    <button type="button" className="Brief-fileRemove" aria-label={`Удалить ${file.name}`} onClick={onRemove}>
      <FileRemoveIcon aria-hidden="true" />
    </button>
  );

  if (isImage) {
    return (
      <li className="Brief-file isImage">
        {preview && <img src={preview} alt={file.name} />}
        {remove}
      </li>
    );
  }

  return (
    <li className="Brief-file isDocument">
      <span className="Brief-fileIcon" aria-hidden="true">
        {extension === 'pdf' ? <FilePdfIcon /> : <FileDocxIcon />}
      </span>
      <span className="Brief-fileText">
        <span className="Brief-fileName">{file.name}</span>
        <span className="Brief-fileType">{extension}</span>
      </span>
      {remove}
    </li>
  );
}

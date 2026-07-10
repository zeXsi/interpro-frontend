import './styles.css';
import Button from '../Button';
import Subtitle from '../Subtitle';

import CheckmarkIcon from 'assets/icons/checkmark.svg?react';
import React, { Activity, PropsWithChildren, useEffect, useId, useRef, useState } from 'react';

import Form, { useForm, type FormConfig } from 'shared/utils/_stm/react/createForm';
import { useNavigate } from '../NavigationTracker';
import { sendExcursion, sendLead, sendLeadPopup, type LeadResponse } from 'api/form';
import { useSignalValue, useWatch } from 'shared/utils/_stm/react/react';
import { email, pipe, safeParse, string } from 'valibot';
import { MWForm } from '../popups/useMWForm';
import { signal } from 'shared/utils/_stm';
import { saveUtmToStorage } from 'api/utm';

function vld<T>(schema: any) {
  return (value: T) => safeParse(schema, value).success;
}

const emailSchema = pipe(string(), email());

// Маска телефона: +7 (XXX) XXX-XX-XX
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

// Индекс цифры для удаления: перед курсором (Backspace) или после (Delete)
function getDigitIndexToRemove(
  formatted: string,
  cursorPos: number,
  forBackspace: boolean
): number {
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

// Валидация российского номера: 11 цифр, начинается с 7
const isValidRuPhone = (value: string) => /^7\d{10}$/.test(String(value ?? '').replace(/\D/g, ''));
const phoneErrorMessage = 'Введите полный номер в формате +7 (XXX) XXX-XX-XX';

type PubValues = {
  username: string;
  phone: string;
  consent: boolean;
  ad: boolean;
};

type GlobValues = {
  nameCompany: string;
} & PubValues;

type MiniValues = {
  username: string;
  phone: string;
} & Pick<PubValues, 'consent' | 'ad'>;

type PopupValues = {
  email: string;
} & PubValues;

type ExcursionValues = {
  username: string;
  phone: string;
  email: string;
  consent: boolean;
  ad: boolean;
  nameCompany: string;
  namePost: string;
};

type ServiceLandingValues = {
  username: string;
  phone: string;
  email: string;
  nameCompany: string;
  area: number;
  terms: string;
  project: string;
  consent: boolean;
  ad: boolean;
};

const publicConf: FormConfig<PubValues> = {
  username: {
    initialValue: '',
    validate: (value) => /^[a-zA-Zа-яА-Я]+$/.test(value),
    title: 'Ваше имя',
    errorMessage: 'Некорректные символы',
  },
  phone: {
    initialValue: '',
    validate: (value) => isValidRuPhone(value),
    title: 'Номер телефона',
    errorMessage: phoneErrorMessage,
  },
  consent: {
    initialValue: false,
    validate: (value: boolean) => value === true,
    title: 'Согласие',
    errorMessage: 'Для отправки формы необходимо подтвердить согласие',
  },
  ad: {
    initialValue: false,
    validate: () => true,
    optional: true,
  },
};

export const isToPrivacy = signal(false);

const globalConf: FormConfig<GlobValues> = {
  ...publicConf,
  nameCompany: {
    initialValue: '',
    validate: (value) => /.+/.test(value),
    title: 'Название компании',
    errorMessage: 'Поле не может быть пустым',
  },
};

const miniConf: FormConfig<MiniValues> = {
  username: {
    initialValue: '',
    validate: (value) => /^[a-zA-Zа-яА-Я]+$/.test(value),
    title: 'Ваше имя',
    errorMessage: 'Некорректные символы',
  },
  phone: {
    initialValue: '',
    validate: (value) => isValidRuPhone(value),
    title: 'Номер телефона',
    errorMessage: phoneErrorMessage,
  },
  consent: {
    initialValue: false,
    validate: (value) => value === true,
    title: 'Согласие',
    errorMessage: 'Для отправки формы необходимо подтвердить согласие',
  },
  ad: {
    initialValue: false,
    validate: () => true,
    optional: true,
  },
};

const popupConf: FormConfig<PopupValues> = {
  ...publicConf,
  email: {
    initialValue: '',
    validate: vld(emailSchema),
    title: 'Почта',
    errorMessage: 'Не правильно указана почта',
  },
};

const excursionConf: FormConfig<ExcursionValues> = {
  ...popupConf,
  nameCompany: {
    initialValue: '',
    validate: (value) => /.+/.test(value),
    title: 'Название компании',
    errorMessage: 'Поле не может быть пустым',
  },
  namePost: {
    initialValue: '',
    validate: (value) => /.+/.test(value),
    title: 'Должность',
    errorMessage: 'Поле не может быть пустым',
  },
};

const serviceLandingConf: FormConfig<ServiceLandingValues> = {
  ...globalConf,
  email: {
    initialValue: '',
    validate: vld(emailSchema),
    title: 'Email',
    errorMessage: 'Неправильно указана почта',
  },
  area: {
    initialValue: NaN,
    validate: () => true,
    title: 'Площадь помещения, м²',
    optional: true,
  },
  terms: {
    initialValue: '',
    validate: () => true,
    title: 'Примерные сроки',
    optional: true,
  },
  project: {
    initialValue: '',
    validate: () => true,
    title: 'Кратко опишите проект',
    optional: true,
  },
};

interface PropsContactForm {
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  onEnd?: () => void;
  type?: 'popup' | 'normal' | 'excursion' | 'mini-normal' | 'service-landing';
  includeArea?: boolean;
  landingPrefix?: 'MuseumSpaces' | 'OfficeRenovation';
  /** Название услуги для type="mini-normal" → extraInfo = "Услуга {serviceName}" */
  serviceName?: string;
}

export default function ContactForm({
  type = 'normal',
  className = '',
  subtitle,
  title,
  onEnd,
  serviceName,
  includeArea = false,
  landingPrefix,
}: PropsContactForm) {
  const { goTo } = useNavigate();
  useEffect(() => {
    saveUtmToStorage();
  }, []);

  const form = useForm(
    type === 'popup'
      ? popupConf
      : type === 'excursion'
        ? excursionConf
        : type === 'mini-normal'
          ? miniConf
          : type === 'service-landing'
            ? serviceLandingConf
          : (globalConf as any)
  );

  const refSend = useRef<HTMLSpanElement>(null);

  const submit = () => {
    form.onSubmit(async (data: any) => {
      refSend.current?.toggleAttribute('disabled', true);
      const extraInfoByType =
        type === 'excursion'
          ? 'Заявка на экскурсию'
          : type === 'popup'
            ? 'Заказать дизайн-проект'
              : type === 'mini-normal'
                ? serviceName
                  ? `Услуга ${serviceName}`
                  : undefined
              : type === 'service-landing'
                ? data.project || 'Заявка со страницы услуги'
              : 'Основная заявка';

      let response: LeadResponse;
      if (type === 'excursion') {
        response = await sendExcursion({
          name: data.username,
          phone: data.phone ?? '',
          email: data.email,
          company: data.nameCompany ?? '',
          post: data.namePost ?? '',
          consent: data.ad,
          extraInfo: extraInfoByType,
        });
      } else if (type === 'popup') {
        response = await sendLeadPopup({
          name: data.username,
          phone: data.phone ?? '',
          email: data.email,
          consent: data.ad,
          extraInfo: extraInfoByType,
        });
      } else if (type === 'mini-normal') {
        response = await sendLead({
          name: data.username,
          phone: data.phone,
          company: '',
          consent: data.ad,
          extraInfo: extraInfoByType,
        });
      } else if (type === 'service-landing') {
        response = await sendLead({
          name: data.username,
          phone: data.phone,
          company: data.nameCompany,
          email: data.email,
          consent: data.consent,
          extraInfo: extraInfoByType,
          terms: data.terms || undefined,
          ...(includeArea && Number.isFinite(data.area) ? { area: data.area } : {}),
        });
      } else {
        response = await sendLead({
          name: data.username,
          phone: data.phone,
          company: data.nameCompany,
          consent: data.ad,
          extraInfo: extraInfoByType,
        });
      }

      if (!response.ok) {
        const ym = typeof window !== 'undefined' ? (window as any).ym : undefined;
        ym?.(99631636, 'reachGoal', 'request_form_false');
        refSend.current?.toggleAttribute('disabled', false);
        return;
      }

      const ym = typeof window !== 'undefined' ? (window as any).ym : undefined;
      const _tmr = typeof window !== 'undefined' ? window._tmr : undefined;
      if (type === 'popup') {
        ym?.(99631636, 'reachGoal', 'request_popup_full');
        _tmr?.push({ type: 'reachGoal', id: 3746602, goal: 'reach_goal_popup' });
      } else {
        ym?.(99631636, 'reachGoal', 'request_form_full');
        _tmr?.push({ type: 'reachGoal', id: 3746602, goal: 'reach_goal_final' });
      }

      refSend.current?.toggleAttribute('false', true);
      onEnd?.();
      goTo('/thankyou');
      form.resetForm();
    });
  };

  const toPrivacy = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>, link: string) => {
    MWForm.v.toClosePopup?.();
    e.stopPropagation();
    goTo?.(link);
  };

  if (type === 'service-landing' && landingPrefix) {
    return (
      <ServiceLandingForm
        form={form}
        prefix={landingPrefix}
        includeArea={includeArea}
        submit={submit}
        refSend={refSend}
      />
    );
  }

  return (
    <div className={`ContactForm ${className} ${type}`} id="ContactForm">
      <Subtitle>( {!subtitle ? 'ЕСТЬ ИДЕИ?' : subtitle} )</Subtitle>
      <div className="ContactForm-title">
        <Activity mode={title ? 'visible' : 'hidden'}>{title}</Activity>
        <Activity mode={!title ? 'visible' : 'hidden'}>Давайте обсудим ваш проект</Activity>
      </div>
      <div className="ContactForm_inner">
        <div className="ContactForm-form">
          {type === 'service-landing' ? (
            <>
              <Input form={form} name="username" />
              <Input form={form} name="nameCompany" />
              <PhoneInput form={form} />
              <Input form={form} name="email" />
              {includeArea && <Input form={form} name="area" inputType="number" />}
              <TermsSelect form={form} />
              <ProjectTextarea form={form} />
            </>
          ) : (
            <>
              <Input form={form} name="username" />
              <PhoneInput form={form} />
              {(type === 'popup' || type === 'excursion') && <Input form={form} name="email" />}
              {(type === 'normal' || type === 'excursion') && <Input form={form} name="nameCompany" />}
            </>
          )}
          {type === 'excursion' && <Input form={form} name="namePost" />}
        </div>
        <div className="ContactForm_footer">
          <Button.Arrow
            ref={refSend}
            className="btn-send"
            onClick={submit}
            direction="right"
            variant="link"
          >
            ОТПРАВИТЬ ЗАЯВКУ
          </Button.Arrow>
          <ConsentCheckbox form={form} name="consent">
            Отправляя данные, Вы соглашаетесь с{' '}
            <span onClick={(e) => toPrivacy(e, '/privacy')}>политикой конфиденциальности</span> и
            даете согласие на обработку персональных данных.
          </ConsentCheckbox>
          <ConsentCheckbox form={form} name="ad" className="ad" isCheckSubmitted={false}>
            Соглашаюсь получать{' '}
            <span onClick={(e) => toPrivacy(e, '/advertising-privacy')}>рекламные материалы</span>
          </ConsentCheckbox>
        </div>
      </div>
    </div>
  );
}

interface ServiceLandingFormProps {
  form: Form<any>;
  prefix: 'MuseumSpaces' | 'OfficeRenovation';
  includeArea: boolean;
  submit: () => void;
  refSend: React.RefObject<HTMLSpanElement | null>;
}

function ServiceLandingForm({
  form,
  prefix,
  includeArea,
  submit,
  refSend,
}: ServiceLandingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const termsField = form.useField('terms');
  const selectedTerm = useSignalValue(termsField.sg.value) ?? '';
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeDropdown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeDropdown);
    return () => document.removeEventListener('pointerdown', closeDropdown);
  }, [isOpen]);

  return (
    <section className={`${prefix}-request px`} id="ContactForm">
      <div className={`${prefix}-requestHead`}>
        <span>( есть идеи? )</span>
        <h2>
          Обсудим
          <br />
          ваш проект
        </h2>
        <p>Расскажите о задаче — мы свяжемся и предложим решение</p>
      </div>

      <form
        className={`${prefix}-requestForm`}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className={`${prefix}-requestLeft`}>
          <ServiceLandingInput form={form} prefix={prefix} name="username" label="Ваше имя*" />
          <ServiceLandingInput
            form={form}
            prefix={prefix}
            name="nameCompany"
            label="Название компании*"
          />
          <ServiceLandingInput
            form={form}
            prefix={prefix}
            name="phone"
            label="Номер телефона*"
            type="tel"
          />
          <ServiceLandingInput
            form={form}
            prefix={prefix}
            name="email"
            label="Email*"
            type="email"
          />
        </div>

        <div className={`${prefix}-requestRight`}>
          {includeArea && (
            <ServiceLandingInput
              className={`${prefix}-areaField`}
              form={form}
              prefix={prefix}
              name="area"
              label="Площадь помещения, м²"
              type="number"
            />
          )}

          <div
            className={`${prefix}-dropdown ${isOpen ? 'active' : ''}`}
            ref={dropdownRef}
          >
            <button type="button" onClick={() => setIsOpen((value) => !value)}>
              <span>{selectedTerm || 'Примерные сроки'}</span>
              <LandingChevronIcon />
            </button>
            <div className={`${prefix}-dropdownMenu`}>
              {projectTerms.map((term) => (
                <button
                  className={selectedTerm === term ? 'selected' : ''}
                  type="button"
                  onClick={() => {
                    form.updateField('terms', term);
                    setIsOpen(false);
                  }}
                  key={term}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <ServiceLandingTextarea form={form} prefix={prefix} />
        </div>

        <div className={`${prefix}-requestFooter`}>
          <Button.Arrow
            ref={refSend}
            className={`${prefix}-submit`}
            direction="right"
            variant="link"
          >
            Отправить заявку
          </Button.Arrow>
          <ServiceLandingConsent form={form} prefix={prefix} />
        </div>
      </form>
    </section>
  );
}

function ServiceLandingInput({
  form,
  prefix,
  name,
  label,
  type = 'text',
  className = '',
}: {
  form: Form<any>;
  prefix: 'MuseumSpaces' | 'OfficeRenovation';
  name: 'username' | 'nameCompany' | 'phone' | 'email' | 'area';
  label: string;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
}) {
  const field = form.useField(name);
  useSignalValue(field.sg.value);
  const isSubmitted = useSignalValue(form.isSubmitted);
  const isError = !!isSubmitted && !form.validateField(name);

  return (
    <label className={`${prefix}-field ${className} ${isError ? 'error' : ''}`}>
      <span>{label}</span>
      <field.Input type={type} placeholder=" " />
      {isError && (
        <p className={`${prefix}-fieldError`}>{field.sg.errorMessage.v}</p>
      )}
    </label>
  );
}

function ServiceLandingTextarea({
  form,
  prefix,
}: {
  form: Form<any>;
  prefix: 'MuseumSpaces' | 'OfficeRenovation';
}) {
  const field = form.useField('project');
  const value = useSignalValue(field.sg.value) ?? '';

  return (
    <label className={`${prefix}-field ${prefix}-fieldProject`}>
      <span>Кратко опишите проект</span>
      <textarea
        name="project"
        placeholder=" "
        value={value}
        onChange={(event) => form.updateField('project', event.target.value)}
      />
    </label>
  );
}

function ServiceLandingConsent({
  form,
  prefix,
}: {
  form: Form<any>;
  prefix: 'MuseumSpaces' | 'OfficeRenovation';
}) {
  const field = form.useField('consent');
  const value = useSignalValue(field.sg.value);
  const isSubmitted = useSignalValue(form.isSubmitted);
  const isError = !!isSubmitted && !form.validateField('consent');

  return (
    <label className={`${prefix}-checkbox ${value ? 'active' : ''} ${isError ? 'error' : ''}`}>
      <field.Input type="checkbox" />
      <span className={`${prefix}-checkboxBox`} aria-hidden="true">
        <CheckmarkIcon className={`${prefix}-checkboxIcon`} />
      </span>
      <span className={`${prefix}-checkboxText`}>
        Отправляя данные, Вы соглашаетесь с политикой конфиденциальности и даёте согласие на
        обработку персональных данных.
      </span>
      {isError && (
        <p className={`${prefix}-checkboxError`}>{field.sg.errorMessage.v}</p>
      )}
    </label>
  );
}

function LandingChevronIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g opacity="0.5">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4 9L12 17L20 9L18 7L12 13L6 7L4 9Z"
          fill="black"
        />
      </g>
    </svg>
  );
}

interface ConsentProps extends PropsWithChildren {
  name: 'consent' | 'ad';
  className?: string;
  isCheckSubmitted?: boolean;
  form: Form<any>;
}

export const ConsentCheckbox = React.memo(
  ({ children, form, isCheckSubmitted = true, className = '', name = 'consent' }: ConsentProps) => {
    const field = form.useField(name);
    const value = useSignalValue(field.sg.value);
    const isSubmitted = useSignalValue(form.isSubmitted);

    const isError = isCheckSubmitted && isSubmitted && !form.validateField(name);

    const toggle = () => {
      field.sg.value.v = !value;
    };

    return (
      <div
        className={`ConsentCheckbox ${className} ${value ? 'active' : ''} ${
          isError ? 'error' : ''
        }`}
      >
        {/* Скрытый input, управляющий сигналом */}
        <field.Input type="checkbox" isHide />

        <div className="wrapper" onClick={toggle}>
          <div className="ConsentCheckbox_checkbox">
            <CheckmarkIcon className="ConsentCheckbox_checkbox-icon" />
          </div>
          <p className="ConsentCheckbox-text">{children}</p>
        </div>

        {isSubmitted && isError && (
          <p className="ConsentCheckbox-error">{form.getSignalField(name).errorMessage.v}</p>
        )}
      </div>
    );
  }
);

interface InputProps {
  name: 'username' | 'phone' | 'nameCompany' | 'email' | 'namePost' | 'area';
  form: Form<any>;
  inputType?: React.HTMLInputTypeAttribute;
}

const InputMessage = React.memo(
  ({ field, form }: { field: ReturnType<Form<any>['useField']>; form: Form<any> }) => {
    const value = useSignalValue(field.sg.value);
    const errorMessage = useSignalValue(field.sg.errorMessage) ?? '';
    const isSubmitted = useSignalValue(form.isSubmitted);

    return (
      <p className="Input-message">
        {(!!value || !!isSubmitted) && errorMessage ? errorMessage : ''}
      </p>
    );
  }
);

const Input = React.memo(({ name, form, inputType = 'text' }: InputProps) => {
  const field = form.useField(name);
  const refInput = useRef<HTMLInputElement>(null);
  const _id = useId();
  const id = `input-${name}-${_id}`;
  const ref = useRef<HTMLDivElement>(null);
  const isTyped = useRef(false);

  useWatch(() => {
    const val = field.sg.value.v;
    const input = ref.current;
    const isSubmitted = form.isSubmitted.v;

    if (!input) return;
    const isValid = form.validateField(name);

    if (isTyped.current) {
      ref.current?.classList.toggle('error', (!!val && !isValid) || (!!isSubmitted && !isValid));
    } else isTyped.current = true;

    ref.current?.classList.toggle('noEmpty', !!val);
  });

  return (
    <div className={`Input`} ref={ref}>
      <div className="Input_wrapper">
        <label htmlFor={id} className="Input-label">
          {field.sg.title.v || ''}
        </label>
        <field.Input
          ref={refInput}
          id={id}
          className="Input-self"
          required={false}
          autoComplete="off"
          type={inputType}
        />
      </div>
      <InputMessage field={field} form={form} />
    </div>
  );
});

const projectTerms = ['до 1 месяца', '1-3 месяца', 'от 3 месяцев', 'пока не определены'];

function TermsSelect({ form }: { form: Form<any> }) {
  const field = form.useField('terms');
  const value = useSignalValue(field.sg.value) ?? '';

  return (
    <label className={`Input ContactForm-terms ${value ? 'noEmpty' : ''}`}>
      <span className="Input-label">{field.sg.title.v}</span>
      <select
        className="Input-self"
        value={value}
        onChange={(event) => form.updateField('terms', event.target.value)}
      >
        <option value="" aria-label="Примерные сроки" />
        {projectTerms.map((term) => (
          <option key={term} value={term}>
            {term}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProjectTextarea({ form }: { form: Form<any> }) {
  const field = form.useField('project');
  const value = useSignalValue(field.sg.value) ?? '';

  return (
    <label className={`Input ContactForm-project ${value ? 'noEmpty' : ''}`}>
      <span className="Input-label">{field.sg.title.v}</span>
      <textarea
        className="Input-self"
        value={value}
        onChange={(event) => form.updateField('project', event.target.value)}
      />
    </label>
  );
}

interface PhoneInputProps {
  form: Form<any>;
}

const PhoneInput = React.memo(({ form }: PhoneInputProps) => {
  const name = 'phone' as const;
  const field = form.useField(name);
  const digits = useSignalValue(field.sg.value) ?? '';
  const isSubmitted = useSignalValue(form.isSubmitted);
  const _id = useId();
  const id = `input-phone-${_id}`;
  const ref = useRef<HTMLDivElement>(null);
  const isTyped = useRef(false);

  useWatch(() => {
    const val = field.sg.value.v;
    const submitted = form.isSubmitted.v;
    if (!ref.current) return;
    const isValid = submitted ? form.validateField(name) : true;
    if (isTyped.current) {
      ref.current?.classList.toggle('error', !!submitted && !isValid);
    } else isTyped.current = true;
    if (!submitted) {
      field.sg.errorMessage.v = '';
    }
    ref.current?.classList.toggle('noEmpty', !!val);
  });

  const formatted = formatPhoneDisplay(String(digits));
  const errorMessage = useSignalValue(field.sg.errorMessage) ?? '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDigits = normalizePhoneDigits(e.target.value);
    field.sg.value.v = newDigits;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPos = input.selectionStart ?? 0;
    const charToDelete =
      e.key === 'Backspace'
        ? formatted[cursorPos - 1]
        : e.key === 'Delete'
          ? formatted[cursorPos]
          : null;

    if (charToDelete && !/\d/.test(charToDelete)) {
      e.preventDefault();
      const idx = getDigitIndexToRemove(formatted, cursorPos, e.key === 'Backspace');
      if (idx >= 0) {
        const arr = String(digits).split('');
        arr.splice(idx, 1);
        field.sg.value.v = arr.join('');
      }
    }
  };

  return (
    <div className="Input" ref={ref}>
      <div className="Input_wrapper">
        <label htmlFor={id} className="Input-label">
          {field.sg.title.v || ''}
        </label>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="Input-self"
          value={formatted}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label={field.sg.title.v || 'Номер телефона'}
        />
      </div>
      <p className="Input-message">{isSubmitted && errorMessage ? errorMessage : ''}</p>
    </div>
  );
});

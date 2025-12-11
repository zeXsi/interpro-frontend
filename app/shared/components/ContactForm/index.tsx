import './styles.css';
import Button from '../Button';
import Subtitle from '../Subtitle';

import CheckmarkIcon from 'assets/icons/checkmark.svg?react';
import React, { Activity, PropsWithChildren, useId, useRef } from 'react';

import Form, { useForm, type FormConfig } from 'shared/utils/_stm/react/createForm';
import { useNavigate } from '../NavigationTracker';
import { sendExcursion, sendLead, sendLeadPopup } from 'api/form';
import { useSignalValue, useWatch } from 'shared/utils/_stm/react/react';
import { email, pipe, safeParse, string } from 'valibot';
import { MWForm } from '../popups/useMWForm';
import { signal } from 'shared/utils/_stm';

function vld<T>(schema: any) {
  return (value: T) => safeParse(schema, value).success;
}

const emailSchema = pipe(string(), email());

type PubValues = {
  username: string;
  phone: string;
  consent: boolean;
  ad: boolean;
};

type GlobValues = {
  nameCompany: string;
} & PubValues;

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

const publicConf: FormConfig<PubValues> = {
  username: {
    initialValue: '',
    validate: (value) => /^[a-zA-Zа-яА-Я]+$/.test(value),
    title: 'Ваше имя',
    errorMessage: 'Некорректные символы',
  },
  phone: {
    initialValue: '',
    validate: (value) => /^\d+$/.test(value),
    title: 'Номер телефона',
    errorMessage: 'Поле должно содержать только цифры.',
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

interface PropsContactForm {
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  onEnd?: () => void;
  type?: 'popup' | 'normal' | 'excursion';
}

export default function ContactForm({
  type = 'normal',
  className = '',
  subtitle,
  title,
  onEnd,
}: PropsContactForm) {
  const { goTo } = useNavigate();

  const form = useForm(
    type === 'popup' ? popupConf : type === 'excursion' ? excursionConf : (globalConf as any)
  );

  const refSend = useRef<HTMLSpanElement>(null);
  // test@gmail.com;
  const submit = () => {
    ym?.(99631636, 'reachGoal', 'request_form');
    form.onSubmit(async (data: any) => {
      refSend.current?.toggleAttribute('disabled', true);
      if (type === 'excursion') {
        await sendExcursion({
          name: data.username,
          phone: data.phone ?? '',
          email: data.email,
          company: data.nameCompany ?? '',
          post: data.namePost ?? '',
          consent: data.ad,
        });
      } else if (type === 'popup') {
        await sendLeadPopup({
          name: data.username,
          phone: data.phone ?? '',
          email: data.email,
          consent: data.ad,
        });
      } else {
        await sendLead({
          name: data.username,
          phone: data.phone,
          company: data.nameCompany,
          consent: data.ad,
        });
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

  return (
    <div className={`ContactForm ${className}`} id="ContactForm">
      <Subtitle>( {!subtitle ? 'ЕСТЬ ИДЕИ?' : subtitle} )</Subtitle>
      <h2 className="ContactForm-title">
        <Activity mode={title ? 'visible' : 'hidden'}>{title}</Activity>
        <Activity mode={!title ? 'visible' : 'hidden'}>
          Давайте обсудим <br className="first" /> ваш проект
        </Activity>
      </h2>
      <div className="ContactForm_inner">
        <div className="ContactForm-form">
          <Input form={form} name="username" />
          <Input form={form} name="phone" />
          {(type === 'popup' || type === 'excursion') && <Input form={form} name="email" />}
          {(type === 'normal' || type === 'excursion') && <Input form={form} name="nameCompany" />}
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
        className={`ConsentCheckbox ${className} ${value ? 'active' : ''} ${isError ? 'error' : ''}`}
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
  name: 'username' | 'phone' | 'nameCompany' | 'email' | 'namePost';
  form: Form<any>;
}

const Input = React.memo(({ name, form }: InputProps) => {
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
        />
      </div>
      <p className="Input-message">{field.sg.errorMessage.v}</p>
    </div>
  );
});

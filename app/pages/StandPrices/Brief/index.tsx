import './styles.css';

import usePopup from '@qtpy/use-popup';
import PlusSmallIcon from 'assets/icons/brief/plus-small.svg?react';
import { sendLead } from 'api/form';
import { useEffect, useState, type ReactNode } from 'react';
import { GlobalScrollLock } from 'shared/components/_helpers/GlobalScrollLock';
import Link from 'shared/components/Link';

// timeUntil пока не используется: подсказка «До выставки…» на согласовании
import { AreaRange, BudgetRange, Checkbox, Consent, DateField, Field, FileField, formatDate } from './controls';
import {
  AREA_MAX,
  AREA_MIN,
  BUDGETS,
  EXHIBITIONS,
  QUESTION_STEPS,
  STAND_STYLES,
  STAND_TYPES,
  STAND_ZONES,
  formatRub,
} from './data';

interface BriefState {
  type: string;
  area: [number, number];
  secondFloor: boolean;
  zones: string[];
  budget: number;
  budgetUnknown: boolean;
  exhibition: string;
  exhibitionDate: Date | null;
  styles: string[];
  styleLinks: string;
  comment: string;
  files: File[];
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  site: string;
  agreed: boolean;
}

const initialState: BriefState = {
  type: '',
  area: [AREA_MIN, AREA_MAX],
  secondFloor: false,
  zones: [],
  budget: 0,
  budgetUnknown: false,
  exhibition: '',
  exhibitionDate: null,
  styles: [],
  styleLinks: '',
  comment: '',
  files: [],
  name: '',
  company: '',
  position: '',
  phone: '',
  email: '',
  site: '',
  agreed: false,
};

type ContactKey = 'name' | 'company' | 'position' | 'phone' | 'email';

const STEPS = ['type', 'area', 'zones', 'budget', 'exhibition', 'style', 'comment', 'contacts', 'done'] as const;
type Step = (typeof STEPS)[number];

/**
 * Поп-ап брифа. Состояние живёт выше портала, поэтому случайное закрытие
 * (клик по фону) не стирает уже введённые ответы.
 */
export default function useBriefPopup() {
  const { Popup, toOpenPopup, toClosePopup } = usePopup(0.3);
  const [state, setState] = useState(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSendFailed, setIsSendFailed] = useState(false);

  // Сброс — при открытии, а не при закрытии: попап закрывается и крестиком, и кликом по фону
  // (его обрабатывает сама библиотека), а итог должен быть одинаковым.
  const open = () => {
    if (STEPS[stepIndex] === 'done') {
      // После ошибки ответы сохраняем — можно отправить ещё раз
      if (isSendFailed) {
        setIsSendFailed(false);
        setStepIndex(STEPS.indexOf('contacts'));
      } else {
        setState(initialState);
        setStepIndex(0);
      }
    }
    toOpenPopup();
  };
  const close = toClosePopup;

  // Элемент, а не компонент: иначе при каждом вводе дерево пересоздавалось бы и поля теряли фокус.
  // Фон закрывает по onPointerDown, а не onClick: если зажать внутри модалки (ползунок,
  // выделение текста) и отпустить на фоне, onClick засчитался бы фону и закрыл бриф.
  const popup = (
    <Popup className="Brief" isOnCloseBG eventCloseBG="onPointerDown">
      <div className="Brief-dialog">
        <button type="button" className="Brief-close" aria-label="Закрыть бриф" onClick={close}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" stroke="#000" strokeWidth="1.5" />
          </svg>
        </button>
        <GlobalScrollLock active={true} className="Brief-modal hideScroll" classInner="Brief-modalInner">
          <BriefSteps
            state={state}
            setState={setState}
            stepIndex={stepIndex}
            setStepIndex={setStepIndex}
            isSendFailed={isSendFailed}
            setIsSendFailed={setIsSendFailed}
            onClose={close}
          />
        </GlobalScrollLock>
      </div>
    </Popup>
  );

  return { open, popup };
}

interface StepsProps {
  state: BriefState;
  setState: React.Dispatch<React.SetStateAction<BriefState>>;
  stepIndex: number;
  setStepIndex: (index: number) => void;
  isSendFailed: boolean;
  setIsSendFailed: (value: boolean) => void;
  onClose: () => void;
}

function BriefSteps({ state, setState, stepIndex, setStepIndex, isSendFailed, setIsSendFailed, onClose }: StepsProps) {
  const step: Step = STEPS[stepIndex];
  const [errors, setErrors] = useState<Partial<Record<ContactKey | 'agreed', string>>>({});
  const [isSending, setIsSending] = useState(false);
  const isCompact = useMediaQuery('(max-width: 1000px)');

  const update = <K extends keyof BriefState>(key: K, value: BriefState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    // Поле исправили — его ошибка больше не актуальна
    setErrors((prev) => (key in prev ? { ...prev, [key]: undefined } : prev));
  };
  const toggle = (key: 'zones' | 'styles', value: string) =>
    setState((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
    }));

  const next = () => setStepIndex(stepIndex + 1);
  const back = () => setStepIndex(stepIndex - 1);

  const canGoNext: Record<Step, boolean> = {
    type: !!state.type,
    area: state.area[0] !== AREA_MIN || state.area[1] !== AREA_MAX,
    zones: state.zones.length > 0,
    budget: true,
    exhibition: true,
    style: true,
    comment: true,
    contacts: true,
    done: true,
  };

  const submit = async () => {
    const nextErrors: typeof errors = {};
    if (!state.name.trim()) nextErrors.name = 'Укажите имя';
    if (!state.company.trim()) nextErrors.company = 'Укажите компанию';
    if (!state.position.trim()) nextErrors.position = 'Укажите должность';
    if (state.phone.replace(/\D/g, '').length < 10) nextErrors.phone = 'Укажите телефон';
    if (!state.email.trim()) nextErrors.email = 'Укажите email';
    else if (!/^\S+@\S+\.\S+$/.test(state.email)) nextErrors.email = 'Проверьте email';
    if (!state.agreed) nextErrors.agreed = 'Для отправки формы необходимо подтвердить согласие';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSending(true);
    const response = await sendLead({
      name: state.name.trim(),
      phone: state.phone.trim(),
      company: state.company.trim(),
      email: state.email.trim(),
      consent: false,
      extraInfo: 'Бриф: цены на выставочные стенды',
      area: state.area[1],
      project: toProjectText(state),
    });
    setIsSending(false);

    // sendLead сам пишет ошибку в консоль; здесь только показываем экран ошибки
    setIsSendFailed(!response.ok);
    next();
  };

  if (step === 'done') {
    return (
      <div className="Brief-step isDone">
        <div className="Brief-done">
          <span className="Brief-doneLabel">{isSendFailed ? '( Произошла ошибка )' : '( Заявка отправлена )'}</span>
          <p className="Brief-question">
            {isSendFailed ? (
              <>
                Кажется, при отправке что-то пошло не&nbsp;так. Попробуйте позже либо свяжитесь с&nbsp;нами по&nbsp;данным
                из&nbsp;подвала
              </>
            ) : (
              <>Мы почти готовы к&nbsp;отрисовке, свяжемся с&nbsp;вами для подтверждения деталей</>
            )}
          </p>
          <NavButton direction="next" onClick={onClose}>
            Закрыть
          </NavButton>
        </div>
      </div>
    );
  }

  return (
    <div className={`Brief-step is-${step}`}>
      <Progress current={Math.min(stepIndex + 1, QUESTION_STEPS)} />

      <div className="Brief-body">
        {step === 'type' && (
          <StepLayout question={<>Какой тип стенда <br className="Brief-compactBreak" />вас интересует?</>}>
            <div className="Brief-types">
              {STAND_TYPES.map(({ title, description, Icon }) => (
                <label key={title} className={`Brief-typeCard ${state.type === title ? 'isActive' : ''}`}>
                  <input type="radio" name="brief-type" checked={state.type === title} onChange={() => update('type', title)} />
                  <span className="Brief-radio" aria-hidden="true" />
                  <span className="Brief-typeImage">{Icon && <Icon />}</span>
                  <span className="Brief-cardTitle">{title}</span>
                  <span className="Brief-cardText">{description}</span>
                </label>
              ))}
            </div>
          </StepLayout>
        )}

        {step === 'area' && (
          <StepLayout question="Какая площадь вашего стенда?">
            <div className="Brief-area">
              <div className="Brief-areaGroup">
                <AreaRange value={state.area} onChange={(value) => update('area', value)} />
                <Checkbox checked={state.secondFloor} onChange={(value) => update('secondFloor', value)}>
                  Планируется второй этаж
                </Checkbox>
              </div>
              <p className="Brief-hint">
                Не знаете точную площадь? Укажите примерную&nbsp;— уточним при обсуждении
              </p>
            </div>
          </StepLayout>
        )}

        {step === 'zones' && (
          <StepLayout question={<>Что&nbsp;должно быть <br />на&nbsp;стенде?</>} stacked>
            <div className="Brief-chips">
              {STAND_ZONES.map(({ title, Icon }) => {
                const isActive = state.zones.includes(title);
                return (
                  <button
                    key={title}
                    type="button"
                    className={`Brief-chip ${isActive ? 'isActive' : ''}`}
                    aria-pressed={isActive}
                    onClick={() => toggle('zones', title)}
                  >
                    <Icon />
                    {title}
                  </button>
                );
              })}
            </div>
          </StepLayout>
        )}

        {step === 'budget' && (
          <StepLayout question="Какой бюджет вы закладываете на стенд?">
            <div className="Brief-budgetWrap">
              <BudgetRange
                value={state.budget}
                disabled={state.budgetUnknown}
                onChange={(value) => update('budget', value)}
                onTouch={() => update('budgetUnknown', false)}
              />
              <Checkbox checked={state.budgetUnknown} onChange={(value) => update('budgetUnknown', value)}>
                Бюджет пока не определён
              </Checkbox>
            </div>
          </StepLayout>
        )}

        {step === 'exhibition' && (
          <StepLayout question={<>Расскажите о вашей <br />выставке</>}>
            <div className="Brief-exhibition">
              <div className="Brief-exhibitionName">
                <Field label="Название выставки" value={state.exhibition} onChange={(value) => update('exhibition', value)} />
                <div className="Brief-suggests">
                  {EXHIBITIONS.map((title) => (
                    <button key={title} type="button" className="Brief-suggest" onClick={() => update('exhibition', title)}>
                      <PlusSmallIcon />
                      {title}
                    </button>
                  ))}
                </div>
              </div>
              <div className="Brief-exhibitionDate">
                <DateField
                  value={state.exhibitionDate}
                  isPickOnly={isCompact}
                  onChange={(value) => update('exhibitionDate', value)}
                />
                {/* Подсказка «До выставки…» на согласовании — пока скрыта
                {state.exhibitionDate && timeUntil(state.exhibitionDate) && (
                  <p className="Brief-dateHint">{timeUntil(state.exhibitionDate)}</p>
                )}
                */}
              </div>
            </div>
          </StepLayout>
        )}

        {step === 'style' && (
          <StepLayout question={<>Какой стиль стенда вам <br />близок?</>} stacked>
            <div className="Brief-styles">
              {STAND_STYLES.map(({ title, description, image }) => {
                const isActive = state.styles.includes(title);
                return (
                  <label key={title} className={`Brief-styleCard ${isActive ? 'isActive' : ''}`}>
                    <input type="checkbox" checked={isActive} onChange={() => toggle('styles', title)} />
                    <span className="Brief-radio" aria-hidden="true" />
                    <span className="Brief-styleBody">
                      <img src={image} alt="" loading="lazy" />
                      <span className="Brief-styleText">
                        <span className="Brief-cardTitle">{title}</span>
                        <span className="Brief-cardText">{description}</span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="Brief-styleLinks">
              <p>Есть ссылки на&nbsp;стенды которые вам нравятся? Вставьте сюда</p>
              <Field
                label={isCompact ? 'Вставьте ссылку' : 'Есть ссылки на стенды которые вам нравятся? Вставьте сюда'}
                inputMode="url"
                value={state.styleLinks}
                onChange={(value) => update('styleLinks', value)}
              />
            </div>
          </StepLayout>
        )}

        {step === 'comment' && (
          <StepLayout question="Есть что добавить?" stacked>
            <div className="Brief-comment">
              <p className="Brief-description">
                Опишите особенности экспонируемой продукции, требования к&nbsp;размещению, пожелания к&nbsp;дизайну или любую
                другую информацию которую считаете важной
              </p>
              <Field label="Что важно учесть?" value={state.comment} onChange={(value) => update('comment', value)} />
              <FileField files={state.files} onChange={(files) => update('files', files)} />
            </div>
          </StepLayout>
        )}

        {step === 'contacts' && (
          <StepLayout
            question={<>Куда отправить <br />концепцию и расчёт?</>}
            aside={
              <NavButton direction="back" muted onClick={back}>
                Назад
              </NavButton>
            }
          >
            <div className="Brief-contacts">
              <div className="Brief-fields">
                <Field label="Имя" autoComplete="name" value={state.name} error={errors.name} onChange={(value) => update('name', value)} />
                <Field label="Компания" autoComplete="organization" value={state.company} error={errors.company} onChange={(value) => update('company', value)} />
                <Field label="Должность" autoComplete="organization-title" value={state.position} error={errors.position} onChange={(value) => update('position', value)} />
                <Field label="Телефон" type="tel" inputMode="tel" autoComplete="tel" value={state.phone} error={errors.phone} onChange={(value) => update('phone', value)} />
                <Field label="Email" type="email" inputMode="email" autoComplete="email" value={state.email} error={errors.email} onChange={(value) => update('email', value)} />
                <Field label="Сайт компании" inputMode="url" autoComplete="url" value={state.site} onChange={(value) => update('site', value)} />
              </div>
              <div className="Brief-submit">
                <NavButton direction="next" disabled={isSending} onClick={submit}>
                  {isSending ? 'Отправляем…' : 'Получить дизайн проект и расчет'}
                </NavButton>
                <Consent checked={state.agreed} error={errors.agreed} onChange={(value) => update('agreed', value)}>
                  Нажимая кнопку, вы соглашаетесь с{' '}
                  <Link to="/privacy" onClick={onClose}>
                    политикой конфиденциальности
                  </Link>
                </Consent>
              </div>
            </div>
          </StepLayout>
        )}
      </div>

      {step !== 'contacts' && (
        <div className="Brief-nav">
          {stepIndex > 0 && (
            <NavButton direction="back" muted onClick={back}>
              Назад
            </NavButton>
          )}
          <NavButton direction="next" className="Brief-next" muted={!canGoNext[step]} disabled={!canGoNext[step]} onClick={next}>
            Далее
          </NavButton>
        </div>
      )}
    </div>
  );
}

interface StepLayoutProps {
  question: ReactNode;
  stacked?: boolean;
  /** Под вопросом в левой колонке; на планшете и мобилке уходит наверх. */
  aside?: ReactNode;
  children: ReactNode;
}

function StepLayout({ question, stacked = false, aside, children }: StepLayoutProps) {
  return (
    <div className={`Brief-layout ${stacked ? 'isStacked' : ''}`}>
      <div className="Brief-question">{question}</div>
      {aside && <div className="Brief-aside">{aside}</div>}
      <div className="Brief-content">{children}</div>
    </div>
  );
}

function Progress({ current }: { current: number }) {
  return (
    <div className="Brief-progress" role="progressbar" aria-valuemin={1} aria-valuemax={QUESTION_STEPS} aria-valuenow={current}>
      {Array.from({ length: QUESTION_STEPS }, (_, index) => (
        <span key={index} className={index < current ? 'isActive' : ''}>
          <i />
        </span>
      ))}
    </div>
  );
}

interface NavButtonProps {
  direction: 'back' | 'next';
  muted?: boolean;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}

function NavButton({ direction, muted = false, disabled = false, className = '', onClick, children }: NavButtonProps) {
  const arrow = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={direction === 'back' ? 'isBack' : ''}>
      <path
        d="M14.9348 6.2162C15.2544 5.89668 15.7723 5.89668 16.0918 6.2162L21.2987 11.4231C21.6182 11.7426 21.6182 12.2605 21.2987 12.58L16.0918 17.7869C15.7723 18.1064 15.2544 18.1064 14.9348 17.7869C14.6153 17.4674 14.6153 16.9494 14.9348 16.6299L18.745 12.8197H3.26562V11.1834H18.745L14.9348 7.37316C14.6153 7.05364 14.6153 6.53572 14.9348 6.2162Z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <button type="button" className={`Brief-navButton ${muted ? 'isMuted' : ''} ${className}`} disabled={disabled} onClick={onClick}>
      {direction === 'back' && arrow}
      <span>{children}</span>
      {direction === 'next' && arrow}
    </button>
  );
}

function toProjectText(state: BriefState) {
  const lines = [
    'Бриф со страницы «Цены на выставочные стенды»',
    `Тип стенда: ${state.type}`,
    state.area[0] === state.area[1] ? `Площадь: ${state.area[0]} м²` : `Площадь: ${state.area[0]}–${state.area[1]} м²`,
    state.secondFloor ? 'Планируется второй этаж' : '',
    state.zones.length ? `Зоны: ${state.zones.join(', ')}` : '',
    `Бюджет: ${state.budgetUnknown ? 'пока не определён' : formatRub(BUDGETS[state.budget]) + (state.budget === BUDGETS.length - 1 ? ' и выше' : '')}`,
    state.exhibition ? `Выставка: ${state.exhibition}` : '',
    state.exhibitionDate ? `Дата открытия: ${formatDate(state.exhibitionDate)}` : '',
    state.styles.length ? `Стиль: ${state.styles.join(', ')}` : '',
    state.styleLinks ? `Ссылки на примеры: ${state.styleLinks}` : '',
    state.comment ? `Комментарий: ${state.comment}` : '',
    state.files.length ? `Файлы (не переданы, запросить у клиента): ${state.files.map((file) => file.name).join(', ')}` : '',
    state.position ? `Должность: ${state.position}` : '',
    state.site ? `Сайт: ${state.site}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

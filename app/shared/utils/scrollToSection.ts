import { lenisManager } from 'shared/utils/lenis';

/** Форма связи в конце страницы */
export const CONTACT_FORM_HASH = '#ContactForm';

/** Высота фиксированного хедера вместе с рекламным баннером */
const HEADER_OFFSET = -120;

const SCROLL_DURATION = 2;

/**
 * Ищет секцию на текущей странице. Один и тот же id может встречаться несколько
 * раз (например, мини-форма в середине страницы и основная в конце), поэтому
 * берём последнюю и пропускаем копии внутри поп-апов
 */
export const findSection = (hash: string) => {
  if (typeof document === 'undefined') return null;

  const sections = Array.from(document.querySelectorAll<HTMLElement>(hash)).filter(
    (section) => !section.closest('.Popup')
  );

  return sections.at(-1) ?? null;
};

/** Скроллит к секции с учётом фиксированного хедера */
export const scrollToSection = (element: HTMLElement) => {
  const lenis = lenisManager.state.v;

  if (lenis) {
    lenis.scrollTo(element, { offset: HEADER_OFFSET, duration: SCROLL_DURATION });
    return;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** Скроллит в самый низ страницы */
export const scrollToPageBottom = () => {
  if (typeof document === 'undefined') return;

  const lenis = lenisManager.state.v;

  if (lenis) {
    lenis.scrollTo(document.body.scrollHeight, { duration: SCROLL_DURATION });
    return;
  }

  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
};

/** Скроллит к форме связи на текущей странице, иначе — в самый низ */
export const scrollToContactForm = () => {
  const element = findSection(CONTACT_FORM_HASH);

  if (element) {
    scrollToSection(element);
    return;
  }

  scrollToPageBottom();
};

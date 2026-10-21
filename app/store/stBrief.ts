/**
 * Открытие брифа из глобальных кнопок «связаться» (хедер, плавающая кнопка).
 * Страница с брифом регистрирует обработчик на время жизни; на остальных
 * страницах его нет, и кнопки ведут себя как обычно.
 */
let briefOpener: (() => void) | null = null;

/** Возвращает функцию отмены регистрации. */
export const registerBriefOpener = (opener: () => void) => {
  briefOpener = opener;

  return () => {
    if (briefOpener === opener) briefOpener = null;
  };
};

export const hasBriefOpener = () => briefOpener !== null;

/** true — бриф открыт, false — на текущей странице брифа нет. */
export const openBrief = () => {
  if (!briefOpener) return false;

  briefOpener();
  return true;
};

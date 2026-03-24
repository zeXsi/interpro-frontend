import './styles.css';

import { signal } from 'shared/utils/_stm';
import { useSignalValue } from 'shared/utils/_stm/react/react';

type CopyToastState = {
  isVisible: boolean;
  message: string;
};

const DEFAULT_MESSAGE = 'Ссылка скопирована';
const EMPTY_TOAST = '\u00A0';

const sgCopyToast = signal<CopyToastState>({
  isVisible: false,
  message: DEFAULT_MESSAGE,
});

let hideTimerId: ReturnType<typeof setTimeout> | null = null;

const clearHideTimer = () => {
  if (hideTimerId) {
    clearTimeout(hideTimerId);
    hideTimerId = null;
  }
};

export const showCopyToast = (message: string = DEFAULT_MESSAGE) => {
  clearHideTimer();

  sgCopyToast.v = {
    isVisible: true,
    message,
  };

  hideTimerId = setTimeout(() => {
    sgCopyToast.v = {
      ...sgCopyToast.v,
      isVisible: false,
    };
    hideTimerId = null;
  }, 2000);
};

export default function CopyToast() {
  const { isVisible, message } = useSignalValue(sgCopyToast);
  const clIsVisible = isVisible ? 'isVisible' : '';

  return (
    <div
      className={`CopyToast ${clIsVisible}`}
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={!isVisible}
    >
      <div className="CopyToast_body">{message || EMPTY_TOAST}</div>
    </div>
  );
}

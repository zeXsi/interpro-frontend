import { showCopyToast } from 'shared/components/CopyToast';

const MAILTO_PREFIX = /^mailto:/i;
const COPY_SUCCESS_MESSAGE = '\u0421\u0441\u044b\u043b\u043a\u0430 \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0430';
const COPY_MAIL_COUNTER_ID = 99631636;
const COPY_MAIL_GOAL_NAME = 'copy_mail';

export const isMailtoHref = (href: string) => MAILTO_PREFIX.test(href);

export const getEmailFromHref = (href: string) =>
  href.replace(MAILTO_PREFIX, '').split('?')[0] ?? '';

const isTrackedEmail = (href: string) =>
  getEmailFromHref(href) === getEmailFromHref(import.meta.env.VITE_EMAIL ?? '');

const trackCopyMail = () => {
  if (typeof ym === 'function') {
    ym(COPY_MAIL_COUNTER_ID, 'reachGoal', COPY_MAIL_GOAL_NAME);
  }
};

const fallbackCopyText = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const isCopied = document.execCommand('copy');
  document.body.removeChild(textarea);

  return isCopied;
};

export const copyTextToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  return fallbackCopyText(text);
};

export const copyEmailToClipboard = async (
  href: string = import.meta.env.VITE_EMAIL,
  successMessage: string = COPY_SUCCESS_MESSAGE
) => {
  const email = getEmailFromHref(href);
  if (!email) return false;

  const isCopied = await copyTextToClipboard(email);
  if (isCopied) {
    showCopyToast(successMessage);

    if (isTrackedEmail(href)) {
      trackCopyMail();
    }
  }

  return isCopied;
};

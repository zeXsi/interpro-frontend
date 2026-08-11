import { HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLElement> {
  children?: string;
  isReplace?: boolean;
}

const HTML_BREAK_PATTERN = /<br\s*\/?>/gi;
const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/i;
const DOUBLE_LINE_BREAK_PATTERN = /(?:\r?\n\s*){2,}/g;
const SINGLE_LINE_BREAK_PATTERN = /\r?\n/g;

const halveLineBreaks = (value: string) => {
  const count = value.match(SINGLE_LINE_BREAK_PATTERN)?.length ?? 0;
  return '<br/>'.repeat(Math.ceil(count / 2));
};

export default function Text({ children, isReplace = false, ...rest }: Props) {
  if (!children) return null;

  const hasHtml = HTML_TAG_PATTERN.test(children);
  const htmlWithBreaks =
    isReplace && hasHtml
      ? children
          .replace(HTML_BREAK_PATTERN, '<br/><br/>')
          .replace(DOUBLE_LINE_BREAK_PATTERN, halveLineBreaks)
          .replace(SINGLE_LINE_BREAK_PATTERN, '')
      : children
          .replace(DOUBLE_LINE_BREAK_PATTERN, halveLineBreaks)
          .replace(SINGLE_LINE_BREAK_PATTERN, '<br/>');

  if (isReplace) {
    return <div { ...rest } dangerouslySetInnerHTML={ { __html: htmlWithBreaks } } />;
  }

  return <p { ...rest } dangerouslySetInnerHTML={ { __html: htmlWithBreaks } } />;
}

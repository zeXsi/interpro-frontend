import { HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLElement> {
  children?: string;
  isReplace?: boolean;
}

const HTML_BREAK_PATTERN = /<br\s*\/?>/gi;
const DOUBLE_LINE_BREAK_PATTERN = /(?:\r?\n\s*){2,}/g;
const SINGLE_LINE_BREAK_PATTERN = /\r?\n/g;

export default function Text({ children, isReplace = false, ...rest }: Props) {
  if (!children) return null;

  const htmlWithBreaks = isReplace
    ? children
        .replace(HTML_BREAK_PATTERN, '<p></p>')
        .replace(DOUBLE_LINE_BREAK_PATTERN, '<p></p>')
        .replace(SINGLE_LINE_BREAK_PATTERN, '')
    : children.replace(SINGLE_LINE_BREAK_PATTERN, '<br/>');

  if (isReplace) {
    return <div { ...rest } dangerouslySetInnerHTML={ { __html: htmlWithBreaks } } />;
  }

  return <p { ...rest } dangerouslySetInnerHTML={ { __html: htmlWithBreaks } } />;
}

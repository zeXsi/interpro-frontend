import { HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLParagraphElement> {
  children?: string;
}

export default function Text({ children, ...rest }: Props) {
  if (!children) return;
  const htmlWithBreaks = children.replace(/\r\n/g, '<br/>');
  return <p { ...rest } dangerouslySetInnerHTML={ { __html: htmlWithBreaks } } />;
}
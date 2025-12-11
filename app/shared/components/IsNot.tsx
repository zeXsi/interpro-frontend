import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  value: any;
}
export default function IsNot({ value, children }: Props) {
  return !!value && children;
}

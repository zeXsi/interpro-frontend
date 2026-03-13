import type { ImgHTMLAttributes } from 'react';
import useIsPdfExport from './useIsPdfExport';

export default function PresentationImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const isPdfExport = useIsPdfExport();

  return (
    <img
      {...props}
      decoding={isPdfExport ? 'sync' : props.decoding}
      loading={isPdfExport ? 'eager' : props.loading}
      fetchPriority={isPdfExport ? 'high' : props.fetchPriority}
    />
  );
}

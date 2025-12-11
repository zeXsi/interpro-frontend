import { useRef, type PropsWithChildren } from 'react';

import styles from './styles.module.css';

import { ScrollRestoration } from 'react-router';
import { signal } from 'shared/utils/_stm';
import { lenisManager } from 'shared/utils/lenis';

const prevURL = signal<string>('');

export default function StartPage({ children }: PropsWithChildren) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <ScrollRestoration
        getKey={(location) => {
          const currentPath = location.pathname;
          const previousPath = prevURL.v;

          const isNewPath = previousPath !== currentPath;
          prevURL.v = currentPath;

          lenisManager.init();
          lenisManager.startRaf();
          lenisManager.state.v?.start();

          if (isNewPath) {
            requestAnimationFrame(() => {
              ref.current?.toggleAttribute('remove', true);
              lenisManager.state.v?.scrollTo(0, {
                duration: 0,
                immediate: false,
              });
              setTimeout(() => {
                ref.current?.toggleAttribute('remove', false);
              }, 100);
            });
          }

          return location.key;
        }}
      />

      <div ref={ref} className={styles.StartPage}>
        {children}
      </div>
    </>
  );
}

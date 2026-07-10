import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

const normalizedPathname = window.location.pathname.replace(/\/{2,}/g, '/');

if (normalizedPathname !== window.location.pathname) {
  window.location.replace(`${normalizedPathname}${window.location.search}${window.location.hash}`);
} else {
  startTransition(() => {
    hydrateRoot(
      document,
      <HydratedRouter />
    );
  });
}

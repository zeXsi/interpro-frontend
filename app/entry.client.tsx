import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { normalizeCanonicalPathname } from 'shared/seo/canonical';

const normalizedPathname = normalizeCanonicalPathname(window.location.pathname);

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

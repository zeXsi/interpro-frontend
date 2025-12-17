import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router';
import './globals.css';
import 'swiper/swiper-bundle.css';

import type { Route } from './+types/root';
import { getProjects } from 'api/projects/projects.api';
import { getFaqs } from 'api/faq/faq.api';
import { getFeedNews, getFeedBlog } from 'api/feed/feed.api';
import { getFeedbacks } from 'api/feedbacks/feedbacks.api';
import { getLicenses } from 'api/licenses/license.api';
import { getServiceCategories, getServices } from 'api/services/services.api';

import { getSSRStore } from 'shared/utils/_stm';
import Header from 'shared/components/Header';

import seoScheme from 'api/seoScheme';
import RouteGuard from 'shared/components/_helpers/RouteGuard';
import NavigationTracker from 'shared/components/NavigationTracker';
import ParallaxFooter from 'shared/components/ParallaxFooter';
import Footer from 'shared/sections/Footer';
import ErrorNotFound from 'pages/ErrorNotFound';
import { startSitemapScheduler } from 'create-sitemap';
import useCookies from 'shared/components/popups/useCookies';
import useMWForm from 'shared/components/popups/useMWForm';

import { useEffect } from 'react';
import { lenisManager } from 'shared/utils/lenis';
import BTNContact from 'shared/components/BTNContact';
import AdBanner from 'shared/components/AdBanner';

const YANDEX_COUNTER_ID = 99631636;

const yandexMetrikaScript = `
  (function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){
      (m[i].a=m[i].a||[]).push(arguments);
    };
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {
      if (document.scripts[j].src === r) {
        return;
      }
    }
    k=e.createElement(t),
    a=e.getElementsByTagName(t)[0],
    k.async=1,
    k.src=r,
    a.parentNode.insertBefore(k,a);
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

  ym(${YANDEX_COUNTER_ID}, "init", {
    webvisor: true,
    clickmap: true,
    accurateTrackBounce: true,
    trackLinks: true
  });
`;

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js"></script> */}
        <Meta />
        <Links />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/favicon_dark.svg"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/favicon_light.svg"
          media="(prefers-color-scheme: dark)"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: seoScheme(data.projects) }}
        />
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: getSSRStore() }} />

        {/* Yandex.Metrika counter */}
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: yandexMetrikaScript }} />
      </head>
      <body>
        {/* Yandex.Metrika counter */}

        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/99631636"
              style={{ position: 'absolute', left: '-9999px' }}
              alt=""
            />
          </div>
        </noscript>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Interpro' },
    { charSet: 'utf-8' },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, viewport-fit=cover',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Interpro' },
    { property: 'og:url', content: import.meta.env.VITE_ORIGINAL_URL },
    { property: 'og:title', content: 'Interpro — Связаться' },
    {
      property: 'og:description',
      content: 'Мы находимся в Telegram, Instagram, YouTube, VK и других соцсетях.',
    },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: 'me', href: import.meta.env.VITE_TELEGRAM_URL_1 },
  { rel: 'me', href: import.meta.env.VITE_TELEGRAM_URL_2 },
  { rel: 'me', href: import.meta.env.VITE_TELEGRAM_URL_3 },
  { rel: 'me', href: import.meta.env.VITE_WHATSAPP_URL },
  { rel: 'me', href: import.meta.env.VITE_INSTAGRAM_URL },
  { rel: 'me', href: import.meta.env.VITE_YOUTUBE_URL },
  { rel: 'me', href: import.meta.env.VITE_VK_URL },
  { rel: 'me', href: import.meta.env.VITE_PINTEREST_URL },
  { rel: 'me', href: import.meta.env.VITE_BEHANCE_URL },
  { rel: 'me', href: import.meta.env.VITE_PHONE },
  { rel: 'me', href: import.meta.env.VITE_EMAIL },
];

export async function loader(_args: Route.LoaderArgs) {
  const [projects] = await Promise.all([
    getProjects(),
    getServiceCategories(),
    getServices(),
    getFeedNews.fetch({}),
    getFeedBlog.fetch({}),
    getLicenses(),
    getFeedbacks(),
    getFaqs(),
  ]);
  await startSitemapScheduler();
  return {
    projects: projects ?? [],
  };
}

export default function App() {
  const cookies = useCookies();
  const form = useMWForm();
  useEffect(() => {
    lenisManager.init();
  }, []);
  return (
    <>
      <div id="root">
        <Header />
        <cookies.Popup />
        <AdBanner />
        <form.Popup />
        <BTNContact />
        <RouteGuard isValidRoutes={['/', '/privacy']} isInverted={true}>
          <NavigationTracker />
        </RouteGuard>
        <ParallaxFooter PreElement={Outlet} Element={FooterC} />
      </div>
    </>
  );
}

const FooterC = () => (
  <RouteGuard isValidRoutes={['/']} isInverted={true}>
    <Footer />
  </RouteGuard>
);

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div id="root">
        <Header />
        <AdBanner />
        <BTNContact />
        <ErrorNotFound />
        <ParallaxFooter
          PreElement={Outlet}
          Element={() => (
            <RouteGuard isValidRoutes={['/']} isInverted={true}>
              <Footer />
            </RouteGuard>
          )}
        />
      </div>
    );
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

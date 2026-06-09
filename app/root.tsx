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
import { useLocation } from 'react-router';

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
import CopyToast from 'shared/components/CopyToast';

import JsonLd from 'shared/seo/JsonLd';
import {
  getBreadcrumbSchema,
  getLocalBusinessSchema,
  getOrganizationSchema,
} from 'shared/seo/schemas';
import { getOpenGraphMeta } from 'shared/seo/meta';

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

const mailRuTopScript = `
  var _tmr = window._tmr || (window._tmr = []);
  _tmr.push({id: "3746602", type: "pageView", start: (new Date()).getTime()});
  (function (d, w, id) {
    if (d.getElementById(id)) return;
    var ts = d.createElement("script"); ts.type = "text/javascript"; ts.async = true; ts.id = id;
    ts.src = "https://top-fwz1.mail.ru/js/code.js";
    var f = function () {var s = d.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ts, s);};
    if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); }
  })(document, window, "tmr-code");
`;

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData();
  const location = useLocation();
  const isPresentationRoute = location.pathname.startsWith('/presentation');
  const isPresentationPrint =
    isPresentationRoute &&
    (location.pathname.endsWith('/print') ||
      new URLSearchParams(location.search).get('export') === 'pdf');

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

        {!isPresentationRoute && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: seoScheme(data.projects) }}
          />
        )}
        {!isPresentationPrint && (
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{ __html: getSSRStore() }}
            suppressHydrationWarning
          />
        )}

        {/* Yandex.Metrika counter */}
        {/* <script type="text/javascript" dangerouslySetInnerHTML={{ __html: yandexMetrikaScript }} /> */}

        {/* Top.Mail.Ru counter */}
        {!isPresentationPrint && (
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{ __html: mailRuTopScript }}
          />
        )}
      </head>
      <body>
        {/* Yandex.Metrika counter */}

        {!isPresentationPrint && (
          <noscript>
            <div>
              <img
                src="https://mc.yandex.ru/watch/99631636"
                style={{ position: 'absolute', left: '-9999px' }}
                alt=""
              />
              <img
                src="https://top-fwz1.mail.ru/counter?id=3746602;js=na"
                style={{ position: 'absolute', left: '-9999px' }}
                alt="Top.Mail.Ru"
              />
            </div>
          </noscript>
        )}
        {children}
        {!isPresentationPrint && <CopyToast />}
        {!isPresentationPrint && <ScrollRestoration />}
        {!isPresentationPrint && <Scripts />}
      </body>
    </html>
  );
}

export function meta({}: Route.MetaArgs) {
  const title = 'Interpro';
  const description = 'Мы находимся в Telegram, Instagram*, YouTube, VK и других соцсетях.';

  return [
    { charSet: 'utf-8' },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, viewport-fit=cover',
    },
    ...getOpenGraphMeta({ title, description }),
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

export async function loader(args: Route.LoaderArgs) {
  const url = new URL(args.request.url);
  const isPresentationRoute = url.pathname.startsWith('/presentation');

  if (isPresentationRoute) {
    return {
      projects: [],
    };
  }

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
  const location = useLocation();
  const cookies = useCookies();
  const form = useMWForm();

  useEffect(() => {
    lenisManager.init();
  }, []);

  const isPresentation = location.pathname.startsWith('/presentation');

  return (
    <>
      {!isPresentation && (
        <>
          <JsonLd data={getOrganizationSchema()} />
          <JsonLd data={getLocalBusinessSchema()} />
          <JsonLd data={getBreadcrumbSchema(location.pathname)} />
        </>
      )}

      <div id="root">
        {!isPresentation && (
          <>
            <Header />
            <cookies.Popup />
            <AdBanner />
            <form.Popup />
            <BTNContact />
            <RouteGuard isValidRoutes={['/', '/privacy']} isInverted={true}>
              <NavigationTracker />
            </RouteGuard>
            <ParallaxFooter PreElement={Outlet} Element={FooterC} />
          </>
        )}
        {isPresentation && <Outlet />}
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

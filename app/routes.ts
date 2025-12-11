import { type RouteConfig, index, prefix, route } from '@react-router/dev/routes';

export default [
  index('./pages/Home/index.tsx'),

  route('/contacts', './pages/Contacts/index.tsx'),
  route('/mapping', './pages/MapWebsite/index.tsx'),
  route('/privacy', './pages/PrivacyPage/index.tsx'),
  route('/advertising-privacy', './pages/PrivacyAdvertisingPage/index.tsx'),
  route('/thankyou', './pages/ThankYouPage/index.tsx'),
  route('/faq', './pages/FAQPage/index.tsx'),
  route('/excursion', './pages/Excursion/index.tsx'),
  route('/*', './pages/ErrorNotFound/index.tsx'),

  ...prefix('/blog', [
    index('./pages/FeedPage/Blog.tsx'),
    route(':slug', './pages/FeedArticle/Blog.tsx'),
  ]),

  ...prefix('/news', [
    index('./pages/FeedPage/News.tsx'),
    route(':slug', './pages/FeedArticle/News.tsx'),
  ]),
  ...prefix('/services', [
    index('./pages/ServiceCategories/index.tsx'),
    route(':slug', './pages/ServiceCategories/pages/ServiceCategory/index.tsx'),
    route(':slug/:slugService', './pages/ServiceCategories/pages/ServicePage/index.tsx'),
  ]),

  ...prefix('/about-us', [
    index('./pages/AboutUs/index.tsx'),
    route('/feedbacks', './pages/AboutUs/Feedbacks/index.tsx'),
    route('/clients', './pages/AboutUs/Clients/index.tsx'),
    route('/certificates', './pages/AboutUs/Certificates/index.tsx'),
  ]),

  ...prefix('/projects', [
    index('./pages/Projects/index.tsx'),
    route(':slug', './pages/Project/index.tsx'),
  ]),
] satisfies RouteConfig;

export type MenuItem = { title: string; link: string };
      // throw new Response('Not found', { status: 404 });

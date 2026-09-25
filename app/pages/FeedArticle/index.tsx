// pages/FeedArticle/index.tsx
import './styles.css';
import Text from 'shared/components/Text';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';
import Subtitle from 'shared/components/Subtitle';
import ContactForm from 'shared/components/ContactForm';
import Article from 'shared/components/Article';
import ExampleProjects from 'shared/components/ExampleProjects';
import useMWImage, { WithDataMWImage } from 'shared/components/popups/useMWImage';
import GalleryImage from 'shared/components/GalleryImage';

import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { useNavigate } from 'shared/components/NavigationTracker';
import { lenisManager } from 'shared/utils/lenis';

import type { FeedItem } from 'api/feed/feed.types';
import {
  getFeedNews,
  getFeedNewsArticle,
  getFeedBlog,
  getFeedBlogArticle,
  type FeedList,
} from 'api/feed/feed.api';

import formatDateToRussian from 'shared/utils/formatDateToRussian';
import StartPage from 'shared/components/StartPage';
import InfoList from 'shared/components/InfoList';

import JsonLd from 'shared/seo/JsonLd';
import { getArticleSchema } from 'shared/seo/schemas';
import { getOpenGraphMeta } from 'shared/seo/meta';
import { sgServiceCategories } from 'api/services/services.api';

export type ArticleData = {
  slug: 'news' | 'blog';
  article: FeedItem;
  articles: FeedItem[];
};

type AnchorLink = {
  id: string;
  title: string;
};

function getReadingTime(article: FeedItem): string {
  if (article.payload.reading_time) return article.payload.reading_time;
  const text = [
    article.payload.subtitle,
    ...article.payload.blocks.flatMap((block) => [
      block.title,
      ...block.descriptions,
    ]),
  ]
    .join(' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:[a-z]+|#\d+|#x[0-9a-f]+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const characters = Array.from(text).length;
  if (characters <= 4500) return '1–3 мин';
  if (characters <= 7500) return '3–5 мин';
  if (characters <= 10500) return '5–7 мин';
  if (characters <= 15000) return '7–10 мин';
  if (characters <= 22500) return '10–15 мин';
  if (characters <= 30000) return '15–20 мин';
  if (characters <= 45000) return '20–30 мин';
  return '30+ мин';
}

export async function _loader(_url: string): Promise<ArticleData> {
  const url = new URL(_url);
  const parts = url.pathname.split('/').filter(Boolean);
  const [slug, id] = parts as ['news' | 'blog', string];

  const isBlog = slug === 'blog';

  if (isBlog) {
    const article = await getFeedBlogArticle.fetch({ slug: id });
    if (!article) {
      throw new Response('Not found', { status: 404 });
    }

    const feed: FeedList = await getFeedBlog.fetch({ page: 1, per_page: 10 });

    return {
      slug: 'blog',
      article,
      articles: feed.articles,
    };
  } else {
    const article = await getFeedNewsArticle.fetch({ slug: id });
    if (!article) {
      throw new Response('Not found', { status: 404 });
    }

    const feed: FeedList = await getFeedNews.fetch({ page: 1, per_page: 10 });

    return {
      slug: 'news',
      article,
      articles: feed.articles,
    };
  }
}

export function _meta(data: ArticleData, pathname: string) {
  const defaultTitle = `Interpro: ${data.article?.payload?.title ?? ''}`;
  const title = data.slug === 'blog' ? data.article.payload.seo?.title?.trim() || defaultTitle : defaultTitle;
  const description =
    data.slug === 'blog'
      ? data.article.payload.seo?.description?.trim() || 'Читайте статью на нашем сайте'
      : 'Читайте новость на нашем сайте';

  return getOpenGraphMeta({
    title,
    description,
    pathname,
    image: data.article?.payload?.cover?.url,
    type: 'article',
  });
}

export default function FeedArticle({ data }: { data: ArticleData }) {
  const { article, articles, slug } = data;
  const { setCrumbs, goTo, getRouteName } = useNavigate();
  const { Popup, showWithData } = useMWImage();
  const location = useLocation();
  const contentBlocks = article?.payload?.blocks ?? [];
  const readingTime = getReadingTime(article);
  const author = article.payload.author;
  const hasAuthor = Boolean(author?.name?.trim() || author?.about?.trim() || author?.image?.url);
  const relatedServices = article?.payload?.related_services ?? [];
  const hasSingleServiceCategory = sgServiceCategories.v.length === 1;
  const anchorLinks = contentBlocks.reduce<AnchorLink[]>((acc, block, index) => {
    const title = block.title?.trim();
    if (!title) return acc;

    acc.push({
      id: `article-block-${index + 1}`,
      title,
    });

    return acc;
  }, []);
  const relatedArticles = articles
    .filter(({ id, slug: itemSlug }) => id !== article.id && itemSlug !== article.slug)
    .slice(0, 3);
  const labels =
    slug === 'blog'
      ? {
          share: 'Поделиться статьёй',
          more: 'Ещё статьи',
        }
      : {
          share: 'Поделиться новостью',
          more: 'Ещё новости',
        };

  useLayoutEffect(() => {
    const path = location.pathname;
    const currentName = getRouteName(path);

    if (currentName && currentName !== path) return;

    if (article?.payload?.title) {
      setCrumbs(path, article.payload.title);
    }
  }, [location.pathname, article, getRouteName, setCrumbs]);

  const shareLink = async () => {
    try {
      await navigator.share({
        title: article?.payload?.title,
        text: article?.payload?.subtitle,
        url: window.location.href,
      });
    } catch {}
  };

  return (
    <StartPage>
      <JsonLd data={getArticleSchema(data)} />
      
      <div className="Feed px">
        <Popup />
        <div className="Feed-wrapper">
          <div className="Feed-wrapper_block">
            <div className="Feed_intro">
              <div className="Feed_header">
                <h1 className="Feed_header-title">{article?.payload?.title}</h1>
                <div className="Feed_header-meta">
                  {hasAuthor && (
                    <div className="Feed_header-author">
                      {author?.image?.url && (
                        <img
                          className="Feed_header-authorImage"
                          src={author.image.url}
                          alt={author.image.alt || author.name || ''}
                          width="44"
                          height="44"
                        />
                      )}
                      {(author?.name?.trim() || author?.about?.trim()) && (
                        <div className="Feed_header-authorText">
                          {author?.name?.trim() && (
                            <span className="Feed_header-authorName">{author.name}</span>
                          )}
                          {author?.about?.trim() && (
                            <p className="Feed_header-authorAbout">{author.about}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="Feed_header-details">
                    <time className="Feed_header-date" dateTime={article.payload.date}>
                      {formatDateToRussian(article.payload.date)}
                    </time>
                    <span className="Feed_header-reading">
                      <svg aria-hidden="true" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g opacity="0.5">
                          <path d="M9 1.125C4.65117 1.125 1.125 4.65117 1.125 9C1.125 13.3488 4.65117 16.875 9 16.875C13.3488 16.875 16.875 13.3488 16.875 9C16.875 4.65117 13.3488 1.125 9 1.125ZM12.1025 11.4205L11.5998 12.1061C11.5889 12.121 11.5751 12.1336 11.5593 12.1432C11.5434 12.1528 11.5259 12.1591 11.5076 12.1619C11.4893 12.1647 11.4706 12.1638 11.4527 12.1594C11.4347 12.1549 11.4178 12.1469 11.4029 12.1359L8.49551 10.016C8.4774 10.003 8.46267 9.98584 8.45258 9.96596C8.44248 9.94607 8.43731 9.92406 8.4375 9.90176V5.0625C8.4375 4.98516 8.50078 4.92188 8.57812 4.92188H9.42363C9.50098 4.92188 9.56426 4.98516 9.56426 5.0625V9.41309L12.0709 11.2254C12.1342 11.2693 12.1482 11.3572 12.1025 11.4205Z" fill="black" />
                        </g>
                      </svg>
                      {readingTime}
                    </span>
                  </div>
                </div>
              </div>

              <Block
                imgs={[article?.payload?.cover]}
                isFirstImg={true}
                className="__first"
                descriptions={[article?.payload?.subtitle || '']}
                anchorLinks={anchorLinks}
                onOpenImg={showWithData}
              />
            </div>
            <Block imgs={article?.payload?.subtitle_photos} onOpenImg={showWithData} />
            {contentBlocks.map((block, i, arr) => (
              <Block
                key={i}
                imgs={block.photos}
                title={block.title}
                descriptions={block.descriptions}
                isLastItem={arr.length - 1 <= i}
                anchorId={block.title?.trim() ? `article-block-${i + 1}` : undefined}
                onOpenImg={showWithData}
              />
            ))}
          </div>

          {relatedServices.length > 0 && (
            <InfoList
              variant={'custom'}
              underline={'center-right'}
              title={`( что делаем )`}
              className="moreServices"
              onClick={(index) => {
                const post = relatedServices[index];
                const category = post?.categories?.[0];
                if (!post || !category?.slug) return;

                const path = hasSingleServiceCategory
                  ? `/services/${post.slug}`
                  : `/services/${category.slug}/${post.slug}`;

                goTo(
                  path,
                  ...(hasSingleServiceCategory ? [post.title] : [category.name, post.title])
                );
              }}
              items={relatedServices.map(({ title }) => [title, ''])}
            />
          )}

          <ExampleProjects projects={article?.payload?.related_projects} goTo={goTo} />

          <Button.Arrow
            onClick={shareLink}
            direction="right"
            className="Feed-shareBtn"
            variant="link"
          >
            {labels.share}
          </Button.Arrow>
          <Networks />

          {relatedArticles?.length > 0 && (
            <div className="Feed_articles">
              <div className="Feed_articles-title">{labels.more}</div>
              <div className="Feed_articles-inner">
                {relatedArticles.map(({ id, payload, slug: itemSlug }) => (
                  <Article
                    key={id}
                    srcImg={payload.cover?.url ?? ''}
                    date={formatDateToRussian(payload.date)}
                    title={payload.title}
                    desc={payload.subtitle}
                    onClick={() => goTo(`/${slug}/${itemSlug}`, payload.title)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <ContactForm />
      </div>
    </StartPage>
  );
}

interface BlockProps {
  title?: string;
  descriptions?: string[];
  imgs?: (FeedItem['payload']['cover'] | undefined)[];
  isFirstImg?: boolean;
  isLastItem?: boolean;
  className?: string;
  anchorLinks?: AnchorLink[];
  anchorId?: string;
  onOpenImg?: (values: WithDataMWImage) => void;
}

export function Block({
  isLastItem = false,
  title,
  descriptions,
  imgs,
  isFirstImg = false,
  className = '',
  anchorLinks = [],
  anchorId,
  onOpenImg,
}: BlockProps) {
  const clIsFirst = isFirstImg ? 'isFirstImg' : '';
  const clImgIsSeconds = (imgs?.length || 0) > 1 ? 'imgIsSeconds' : '';
  const clIsLastItem = isLastItem ? 'isLastItem' : '';
  const imageUrls = imgs?.flatMap((props) => (props?.url ? [props.url] : [])) ?? [];
  const hasDescriptions = (descriptions?.length ?? 0) > 0;

  const _isNoneGlobal = { curr: 0 };

  const isNone = (data: any, count?: { curr: number }) => {
    //prettier-ignore
    if (count) count.curr += Number(!!data)
    return !data ? 'isNone' : '';
  };

  const _isNoneLocal = { curr: 0 };
  isNone(title, _isNoneGlobal);
  isNone(descriptions?.length, _isNoneLocal);
  isNone(imgs?.length, _isNoneLocal);
  _isNoneGlobal.curr += _isNoneLocal.curr;

  if (_isNoneGlobal.curr === 0) {
    return null;
  }

  const scrollToAnchor = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const lenis = lenisManager.state.v;
    if (lenis) {
      lenis.scrollTo(element, { offset: -150, duration: 1.2 });
      return;
    }

    const top = element.getBoundingClientRect().top + window.scrollY - 150;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div id={anchorId} className={`Block ${clIsFirst} ${clIsLastItem} ${className}`}>
      <div className="Block-wrapper_title_desc">
        {title?.trim() ? <h2 className="Block-title">{title}</h2> : null}
        <div className="Block-wrapper_desc_imgs">
          {hasDescriptions && (
            <div key="desc" className={`Block-descriptions`}>
              {descriptions?.map((description, index, arr) => (
                <Text
                  key={index}
                  data-last-item={arr.length - 1 <= index}
                  className="Block-description"
                  isReplace
                  children={description}
                />
              ))}
            </div>
          )}

          {isFirstImg && anchorLinks.length > 0 && (
            <div className="anchor_links">
              <p className="anchor_links-title">Содержание статьи:</p>
              <div className="anchor_links-block">
                {anchorLinks.map((link) => (
                  <div
                    key={link.id}
                    className="wrap-button"
                    onMouseEnter={(e) =>
                      e.currentTarget
                        .querySelector<HTMLButtonElement>('.Button')
                        ?.classList.add('isHover')
                    }
                    onMouseLeave={(e) =>
                      e.currentTarget
                        .querySelector<HTMLButtonElement>('.Button')
                        ?.classList.remove('isHover')
                    }
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) return;

                      e.currentTarget.querySelector<HTMLButtonElement>('.Button')?.click();
                    }}
                  >
                    <Button
                      variant="link"
                      underline="center-right"
                      onClick={() => scrollToAnchor(link.id)}
                    >
                      {link.title}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {imageUrls.length > 0 && (
            <div key="imgs" className={`Block_imgs ${clImgIsSeconds}`}>
              {imageUrls.map((src, index) => (
                <GalleryImage
                  key={index}
                  wrapperClassName="Block_imgs-item"
                  src={src}
                  onClick={() => onOpenImg?.([index, imageUrls])}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Networks() {
  return (
    <div className="Feed_networks">
      <Subtitle title="( наши медиа )" />
      <div className="Feed_networks-inner">
        <Link to={import.meta.env.VITE_TELEGRAM_URL_2} typeLink="external">
          <Button subTitle="Новости и проекты" variant="outline">
            Telegram—канал
          </Button>
        </Link>
        {/* <Link to={import.meta.env.VITE_TELEGRAM_URL_3} typeLink="external">
          <Button subTitle="Жизнь компании" variant="outline">
            Telegram—live
          </Button>
        </Link> */}
        <Link to={import.meta.env.VITE_YOUTUBE_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            Youtube
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_INSTAGRAM_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            Instagram*
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_VK_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            VK
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_BEHANCE_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            Behance
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_PINTEREST_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            Pinterest
          </Button>
        </Link>
      </div>
    </div>
  );
}

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

export type ArticleData = {
  slug: 'news' | 'blog';
  article: FeedItem;
  articles: FeedItem[];
};

type AnchorLink = {
  id: string;
  title: string;
};

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

export function _meta(data: ArticleData) {
  const title = `Interpro: ${data.article?.payload?.title ?? ''}`;
  const description =
    data.slug === 'blog' ? 'Читайте статью на нашем сайте' : 'Читайте новость на нашем сайте';

  return [
    { title },
    { name: 'description', content: description },

    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];
}

export default function FeedArticle({ data }: { data: ArticleData }) {
  const { article, articles, slug } = data;
  const { setCrumbs, goTo, getRouteName } = useNavigate();
  const { Popup, showWithData } = useMWImage();
  const location = useLocation();
  const contentBlocks = article?.payload?.blocks ?? [];
  const relatedServices = article?.payload?.related_services ?? [];
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
      <div className="Feed px">
        <Popup />
        <div className="Feed-wrapper">
          <div className="Feed-wrapper_block">
            <div className="Feed_header">
              <h1 className="Feed_header-title">{article?.payload?.title}</h1>
              <span className="Feed_header-date">
                {formatDateToRussian(article?.payload?.date || '')}
              </span>
            </div>

            <Block
              imgs={[article?.payload?.cover]}
              isFirstImg={true}
              className="__first"
              descriptions={[article?.payload?.subtitle || '']}
              anchorLinks={anchorLinks}
              onOpenImg={showWithData}
            />
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

                goTo(`/services/${category.slug}/${post.slug}`, category.name, post.title);
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
                <img
                  key={index}
                  className="Block_imgs-item"
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

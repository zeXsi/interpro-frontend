// pages/FeedArticle/index.tsx
import './styles.css';
import Text from 'shared/components/Text';
import Button from 'shared/components/Button';
import Link from 'shared/components/Link';
import Subtitle from 'shared/components/Subtitle';
import ContactForm from 'shared/components/ContactForm';
import Article from 'shared/components/Article';

import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { useNavigate } from 'shared/components/NavigationTracker';

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

export type ArticleData = {
  slug: 'news' | 'blog';
  article: FeedItem;
  articles: FeedItem[];
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
  const titleSegment = data.slug === 'blog' ? 'блог' : 'новости';
  const subtitle = data.article?.payload?.subtitle ?? 'описание статьи';

  const title = `Interpro: ${titleSegment}`;
  const description = subtitle;

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
  const location = useLocation();

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
        <div className="Feed-wrapper">
          <div className="Feed_header">
            <h1 className="Feed_header-title">{article?.payload?.title}</h1>
            <span className="Feed_header-date">
              {formatDateToRussian(article?.payload?.date || '')}
            </span>
          </div>

          <div className="Feed-wrapper_block">
            <Block
              imgs={[article?.payload?.cover]}
              isFirstImg={true}
              className="__first"
              descriptions={[article?.payload?.subtitle || '']}
            />
            <Block imgs={article?.payload?.subtitle_photos} />
            {article?.payload?.blocks.map((block, i, arr) => (
              <Block
                key={i}
                imgs={block.photos}
                title={block.title}
                descriptions={block.descriptions}
                isLastItem={arr.length - 1 <= i}
              />
            ))}
          </div>

          <Button.Arrow
            onClick={shareLink}
            direction="right"
            className="Feed-shareBtn"
            variant="link"
          >
            Поделиться статьёй
          </Button.Arrow>
          <Networks />

          <div className="Feed_articles">
            <div className="Feed_articles-title">Ещё статьи</div>
            <div className="Feed_articles-inner">
              {articles.map(({ payload, slug: itemSlug }, index) => (
                <Article
                  key={index}
                  srcImg={payload.cover.url}
                  date={formatDateToRussian(payload.date)}
                  title={payload.title}
                  desc={payload.subtitle}
                  onClick={() => goTo(`/${slug}/${itemSlug}`, payload.title)}
                />
              ))}
            </div>
          </div>
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
}
interface BlockProps {
  title?: string;
  descriptions?: string[];
  imgs?: (FeedItem['payload']['cover'] | undefined)[];
  isFirstImg?: boolean;
  isLastItem?: boolean;
  className?: string;
}

export function Block({
  isLastItem = false,
  title,
  descriptions,
  imgs,
  isFirstImg = false,
  className = '',
}: BlockProps) {
  const clIsFirst = isFirstImg ? 'isFirstImg' : '';
  const clImgIsSeconds = (imgs?.length || 0) > 1 ? 'imgIsSeconds' : '';
  const clIsLastItem = isLastItem ? 'isLastItem' : '';

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

  const blocks = [
    <div key="desc" className={`Block-descriptions ${isNone(descriptions?.length, _isNoneLocal)}`}>
      {descriptions?.map((description, index, arr) => (
        <Text
          key={index}
          data-last-item={arr.length - 1 <= index}
          className="Block-description"
          children={description}
        />
      ))}
    </div>,
    <div
      key="imgs"
      className={`Block_imgs ${isNone(imgs?.length, _isNoneLocal)} ${clImgIsSeconds}`}
    >
      {imgs?.map((props, index) =>
        props?.url ? <img key={index} className="Block_imgs-item" src={props.url} /> : null
      )}
    </div>,
  ];

  return (
    <div className={`Block ${clIsFirst} ${clIsLastItem} ${className}`}>
      <div className="Block-wrapper_title_desc">
        <div className={`Block-title ${isNone(title, _isNoneGlobal)}`}>{title}</div>
        <div className="Block-wrapper_desc_imgs">{isFirstImg ? blocks.reverse() : blocks}</div>
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
        <Link to={import.meta.env.VITE_TELEGRAM_URL_3} typeLink="external">
          <Button subTitle="Жизнь компании" variant="outline">
            Telegram—live
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_YOUTUBE_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            Youtube
          </Button>
        </Link>
        <Link to={import.meta.env.VITE_INSTAGRAM_URL} typeLink="external">
          <Button className="addPadd" variant="outline">
            Instagram
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

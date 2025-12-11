import { useEffect } from 'react';

interface TitleProps {
  title: string;
  description?: string;
  defaultTitle?: string;
}

const SEOTitle = ({ title, description = '', defaultTitle = '' }: TitleProps) => {
  useEffect(() => {
    document.title = title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta') as HTMLMetaElement;
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    return () => {
      document.title = defaultTitle;
      if (meta) meta.content = '';
    };
  }, [title, description, defaultTitle]);

  return null;
};

export default SEOTitle;

export interface FeedCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: any[];
  payload: {
    id: number;
    slug: string;
    name: string;
    parent: number;
    description: string;
    cover: string | null;
    order: number;
    count: number;
    tags: any[];
    children: any[];
    posts: {
      id: number;
      slug: string;
      title: string;
    }[];
  };
  _links: {
    self: {
      href: string;
    }[];
    collection?: {
      href: string;
    }[];
    about?: {
      href: string;
    }[];
    [key: string]: any; // на случай доп. полей в _links
  };
}



export interface FeedItem {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  featured_media: number;
  template: string;
  news_category: number[];
  class_list: string[];
  payload: {
    id: number;
    slug: string;
    date: string;
    title: string;
    subtitle: string;
    subtitle_photos: {
      id: number;
      url: string;
      width: number;
      height: number;
      alt: string;
      caption: string;
      mime: string;
    }[];
    cover: {
      id: number;
      url: string;
      width: number;
      height: number;
      alt: string;
      caption: string;
      mime: string;
    };
    blocks: {
      descriptions: string[],
      title: string,
      photos: {
        id: number;
        url: string;
        width: number;
        height: number;
        alt: string;
        caption: string;
        mime: string;
      }[]
    }[]
    categories: {
      id: number;
      slug: string;
      name: string;
      parent: number;
      description: string;
      cover: {
        id: number;
        url: string;
        width: number;
        height: number;
        alt: string;
        caption: string;
        mime: string;
      } | null;
      order: number;
      count: number;
      tags: any[];
    }[];
  };
  _links: {
    self: {
      href: string;
      targetHints?: {
        allow: string[];
      };
    }[];
    collection: {
      href: string;
    }[];
    about: {
      href: string;
    }[];
    "version-history": {
      count: number;
      href: string;
    }[];
    "predecessor-version": {
      id: number;
      href: string;
    }[];
    "wp:featuredmedia": {
      embeddable: boolean;
      href: string;
    }[];
    "wp:attachment": {
      href: string;
    }[];
    "wp:term": {
      taxonomy: string;
      embeddable: boolean;
      href: string;
    }[];
    curies: {
      name: string;
      href: string;
      templated: boolean;
    }[];
  };
}

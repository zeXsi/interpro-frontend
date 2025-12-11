import { NextItem } from '../api.types';

export interface Service {
  id: number;
  date: string; // ISO string
  date_gmt: string; // ISO string
  guid: {
    rendered: string;
  };
  modified: string; // ISO string
  modified_gmt: string; // ISO string
  slug: string;
  status: string;
  type: string;
  link: string;
  name: string;
  title: {
    rendered: string;
  };
  featured_media: number;
  template: string;
  service_category: number[];
  class_list: string[];
  payload: {
    id: number;
    slug: string;
    date: string; // ISO string with timezone
    title: string;
    description: string;
    cover: string | null;
    category: {
      id: number;
      slug: string;
      name: string;
      parent: number;
      description: string;
      cover: string | null;
      order: number;
      count: number;
      tags: string[];
    };
  };
  _links: {
    self: Array<{
      href: string;
      targetHints?: {
        allow: string[];
      };
    }>;
    collection: Array<{
      href: string;
    }>;
    about: Array<{
      href: string;
    }>;
    'version-history': Array<{
      count: number;
      href: string;
    }>;
    'predecessor-version': Array<{
      id: number;
      href: string;
    }>;
    'wp:attachment': Array<{
      href: string;
    }>;
    'wp:term': Array<{
      taxonomy: string;
      embeddable: boolean;
      href: string;
    }>;
    curies: Array<{
      name: string;
      href: string;
      templated: boolean;
    }>;
  };
}

export interface ServiceCategory {
  nextItem?: NextItem;
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
    tags: string[];
    children: [];
    posts: {
      id: number;
      slug: string;
      title: string;
    }[];
  };
  _links: {
    self: Array<{
      href: string;
      targetHints?: {
        allow: string[];
      };
    }>;
    collection: Array<{
      href: string;
    }>;
    about: Array<{
      href: string;
    }>;
    'wp:post_type': Array<{
      href: string;
    }>;
    curies: Array<{
      name: string;
      href: string;
      templated: boolean;
    }>;
  };
}

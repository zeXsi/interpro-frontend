import { NextItem } from "../api.types";

export interface Project {
  nextItem?: NextItem
  id: number;
  date: string; // ISO date string
  date_gmt: string; // ISO date string
  guid: {
    rendered: string;
  };
  modified: string; // ISO date string
  modified_gmt: string; // ISO date string
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  featured_media: number;
  template: string;
  'type-stand': number[];
  'year-stand': number[];
  'exhibition-stand': number[];
  class_list: string[];
  payload: {
    title: string;
    about: string;
    cover: string;
    video: string;
    show_on_home: boolean;
    seo: {
      description: string,
      title:string,
    },
    meta: {
      exhibition: {
        id: number;
        slug: string;
        name: string;
      }[];
      year: {
        id: number;
        slug: string;
        name: string;
      };
      area: number;
      type_tax: {
        id: number;
        slug: string;
        name: string;
      }[];
    };
    blocks: {
      intro: {
        title: string;
        photos: string[];
      };
      drawings: string[];
      viz3d: {
        image: string;
        size: string;
        area: number;
      };
      details: {
        title: string;
        photos: string[];
      }[];
    };
  };

  _links: {
    self: { href: string; targetHints?: { allow: string[] } }[];
    collection: { href: string }[];
    about: { href: string }[];
    'version-history'?: { count: number; href: string }[];
    'predecessor-version'?: { id: number; href: string }[];
    'wp:featuredmedia'?: { embeddable: boolean; href: string }[];
    'wp:attachment'?: { href: string }[];
    'wp:term'?: { taxonomy: string; embeddable: boolean; href: string }[];
    curies?: { name: string; href: string; templated: boolean }[];
  };
}


export interface ExhibitionStandItem {
  id: number;
  slug: string;
  name: string;
  count: number;
}

export interface ExhibitionStand {
  exhibition_stand: ExhibitionStandItem[];
  type_stand: ExhibitionStandItem[];
  year_stand: ExhibitionStandItem[];
}

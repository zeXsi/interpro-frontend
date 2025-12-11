export interface Faq {
  id: number;
  date: string; // ISO datetime
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
  class_list: string[];
  payload: {
    question: string;
    answer: string;
    cover: string | null;
    date: string; // ISO datetime
  };
  _links: {
    self: Array<{
      href: string;
      targetHints?: {
        allow: string[];
      };
    }>;
    collection: Array<{ href: string }>;
    about: Array<{ href: string }>;
    "version-history"?: Array<{ count: number; href: string }>;
    "predecessor-version"?: Array<{ id: number; href: string }>;
    "wp:attachment"?: Array<{ href: string }>;
    curies?: Array<{
      name: string;
      href: string;
      templated: boolean;
    }>;
  };
}

export interface Feedback {
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
  class_list: string[];
  payload: {
    title: string;
    company: string;
    person: {
      name: string;
      position: string;
    };
    text: string;
    pdf: string;
    cover: string | null;
    date: string;
  };
  _links: {
    self: Array<{
      href: string;
      targetHints: {
        allow: string[];
      };
    }>;
    collection: Array<{ href: string }>;
    about: Array<{ href: string }>;
    "version-history": Array<{ count: number; href: string }>;
    "predecessor-version": Array<{ id: number; href: string }>;
    "wp:attachment": Array<{ href: string }>;
    curies: Array<{ name: string; href: string; templated: boolean }>;
  };
}

export interface HomeProjectCover {
  id?: number;
  url: string;
  width?: number;
  height?: number;
  srcset?: string;
  sizes?: string;
}

export interface HomeProject {
  id: number;
  slug: string;
  title: string;
  exhibition: string | null;
  year: number | string | null;
  area: number;
  cover: HomeProjectCover | null;
}

export interface HomeServicePost {
  id: number;
  slug: string;
  title: string;
}

export interface HomeServiceNavigationNode {
  id: number;
  slug: string;
  name: string;
  description?: string;
  children: HomeServiceNavigationNode[];
  posts: HomeServicePost[];
}

export interface HomeFeedback {
  title: string;
  company: string;
  person: {
    name: string;
    position: string;
  };
  text: string;
  pdf: string | null;
  date: string;
}

export interface HomeFaq {
  id: number;
  question: string;
  answer: string;
}

export interface HomeData {
  schema_version: 1;
  projects: {
    total: number;
    items: HomeProject[];
  };
  services_navigation: HomeServiceNavigationNode[];
  feedbacks: HomeFeedback[];
  faqs: HomeFaq[];
}

export const EMPTY_HOME_DATA: HomeData = {
  schema_version: 1,
  projects: {
    total: 0,
    items: [],
  },
  services_navigation: [],
  feedbacks: [],
  faqs: [],
};

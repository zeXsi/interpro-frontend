import { createQuery } from 'shared/utils/querySignal';
import type { Faq } from './faq.types';


const qFaqs = createQuery<Faq[]>({
  endpoint: '/faqs',
  initial: [],
});

export const sgFaqs = qFaqs.sg;
export const getFaqs = (): Promise<Faq[]> => qFaqs.fetch({});

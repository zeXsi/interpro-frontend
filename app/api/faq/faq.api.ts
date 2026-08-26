import { createQuery } from 'shared/utils/querySignal';
import type { Faq } from './faq.types';
import { QUERY_FAMILIES } from 'api/queryFamilies';


const qFaqs = createQuery<Faq[]>({
  endpoint: '/faqs',
  family: QUERY_FAMILIES.faqs,
  initial: [],
});

export const sgFaqs = qFaqs.sg;
export const getFaqs = (): Promise<Faq[]> => qFaqs.fetch({});
export const primeFaqs = (force = false, updateSignal = false) =>
  qFaqs.prime({}, { force, updateSignal });

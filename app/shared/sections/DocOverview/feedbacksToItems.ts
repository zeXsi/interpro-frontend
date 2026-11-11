import type { Feedback } from 'api/feedbacks/feedbacks.types';
import type { ReviewItem } from '.';

export default function feedbacksToItems(
  feedbacks: { payload: Pick<Feedback['payload'], 'company' | 'text' | 'pdf' | 'person'> }[]
): ReviewItem[] {
  return feedbacks.map(({ payload }) => ({
    company: payload.company,
    text: payload.text,
    pdfUrl: payload.pdf,
    personName: payload.person?.name,
    personPosition: payload.person?.position,
  }));
}

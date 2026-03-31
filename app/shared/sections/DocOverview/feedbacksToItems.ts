import { sgFeedbacks } from 'api/feedbacks/feedbacks.api';
import { ReviewItem } from '.';

export default function feedbacksToItems(isNotPage?: boolean): ReviewItem[] {
  return sgFeedbacks.v.slice(0, !isNotPage ? Infinity : 4).map(({ payload }) => ({
    company: payload.company,
    text: payload.text,
    pdfUrl: payload.pdf,
    personName: payload.person?.name,
    personPosition: payload.person?.position,
  }));
}

import { createQuery } from "shared/utils/querySignal";
import type { Feedback } from "./feedbacks.types";
import { QUERY_FAMILIES } from 'api/queryFamilies';

type PaginationParams = {
  per_page: number;
};

const qFeedbacks = createQuery<Feedback[], PaginationParams>({
  endpoint: '/feedbacks',
  family: QUERY_FAMILIES.feedbacks,
  initial: [],
});

export const sgFeedbacks = qFeedbacks.sg;
export const getFeedbacks = (): Promise<Feedback[]> => qFeedbacks.fetch({ per_page: 100 });
export const primeFeedbacks = (force = false, updateSignal = false) =>
  qFeedbacks.prime({ per_page: 100 }, { force, updateSignal });

import { createQuery } from "shared/utils/querySignal";
import type { Feedback } from "./feedbacks.types";

type PaginationParams = {
  per_page: number;
};

const qFeedbacks = createQuery<Feedback[], PaginationParams>({
  endpoint: '/feedbacks',
  initial: [],
});

export const sgFeedbacks = qFeedbacks.sg;
export const getFeedbacks = (): Promise<Feedback[]> => qFeedbacks.fetch({ per_page: 100 });

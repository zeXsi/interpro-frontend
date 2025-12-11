import { createQuery } from "shared/utils/querySignal";
import type { Feedback } from "./feedbacks.types";


const qFeedbacks = createQuery<Feedback[]>({
  endpoint: '/feedbacks',
  initial: [],
});

export const sgFeedbacks = qFeedbacks.sg;
export const getFeedbacks = (): Promise<Feedback[]> => qFeedbacks.fetch({});

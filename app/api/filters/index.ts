import { ExhibitionStand } from "api/projects/projects.types";
import { createQuery } from "shared/utils/querySignal";


const qFilters = createQuery<Partial<ExhibitionStand>>({
  endpoint: '/project-facets',
  initial: {},
});

export const sgFilters = qFilters.sg;
export const getFilters = (): Promise<Partial<ExhibitionStand>> => qFilters.fetch({});

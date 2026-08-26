import { ExhibitionStand } from "api/projects/projects.types";
import { createQuery } from "shared/utils/querySignal";
import { QUERY_FAMILIES } from 'api/queryFamilies';


const qFilters = createQuery<Partial<ExhibitionStand>>({
  endpoint: '/project-facets',
  family: QUERY_FAMILIES.projects,
  initial: {},
});

export const sgFilters = qFilters.sg;
export const getFilters = (): Promise<Partial<ExhibitionStand>> => qFilters.fetch({});
export const primeFilters = (force = false) => qFilters.prime({}, { force });

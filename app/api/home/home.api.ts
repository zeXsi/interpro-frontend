import { interproApiBaseURL } from 'api/api.config';
import { QUERY_FAMILIES } from 'api/queryFamilies';
import { createQuery } from 'shared/utils/querySignal';
import { EMPTY_HOME_DATA, type HomeData } from './home.types';

export const homeDataEndpoint = `${interproApiBaseURL}/home`;

const qHomeData = createQuery<HomeData, void>({
  endpoint: homeDataEndpoint,
  family: QUERY_FAMILIES.home,
  stateKey: 'home-data',
  initial: EMPTY_HOME_DATA,
  map: (data) => {
    if (
      data?.schema_version !== 1 ||
      !Number.isFinite(data?.projects?.total) ||
      data.projects.total < 0 ||
      !Array.isArray(data.projects.items) ||
      !Array.isArray(data.services_navigation) ||
      !Array.isArray(data.feedbacks) ||
      !Array.isArray(data.faqs)
    ) {
      throw new Error('Invalid home data response or unsupported schema version');
    }
    return data;
  },
});

export const sgHomeData = qHomeData.sg;
export const getHomeData = () => qHomeData.fetch();
export const primeHomeData = (force = false, updateSignal = false) =>
  qHomeData.prime(undefined, { force, updateSignal });

export const isHomeDataLoaded = (data: HomeData) => data !== EMPTY_HOME_DATA;

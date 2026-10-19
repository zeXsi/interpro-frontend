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
});

export const sgHomeData = qHomeData.sg;
export const getHomeData = () => qHomeData.fetch();
export const primeHomeData = (force = false, updateSignal = false) =>
  qHomeData.prime(undefined, { force, updateSignal });

export const isHomeDataLoaded = (data: HomeData) => data !== EMPTY_HOME_DATA;

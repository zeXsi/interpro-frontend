// shared/api/licenses.ts
import type { License } from './license.types';
import { createQuery } from 'shared/utils/querySignal';
import { QUERY_FAMILIES } from 'api/queryFamilies';

const qLicenses = createQuery<License[], void>({
  endpoint: '/licenses',
  family: QUERY_FAMILIES.licenses,
  initial: [],
});

export const sgLicenses = qLicenses.sg;
export const getLicenses = () => qLicenses.fetch();
export const primeLicenses = (force = false, updateSignal = false) =>
  qLicenses.prime(undefined, { force, updateSignal });

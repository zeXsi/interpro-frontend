import { AsyncLocalStorage } from 'node:async_hooks';

import {
  createSSRRequestState,
  setSSRRequestStateProvider,
  type SSRRequestState,
} from './index.ts';

const requestStateStorage = new AsyncLocalStorage<SSRRequestState>();

setSSRRequestStateProvider(() => requestStateStorage.getStore());

export function runWithSSRRequestState<T>(callback: () => T): T {
  return requestStateStorage.run(createSSRRequestState(), callback);
}

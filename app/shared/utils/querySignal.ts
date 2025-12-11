// querySignal.ts
import { instance } from 'api/api.config';
import { ssrSignal, type SSRSignal } from './_stm';


interface CreateQueryOptions<TData, TParams = any, TParent = any> {
  endpoint: string;
  initial: TData;
  parent?: SSRSignal<TParent>;
  findInParent?: (parent: TParent, params: TParams) => TData | null | undefined;
  takeFirst?: boolean;
  map?: (data: any, resp: any, params: TParams) => TData;
  middleware?: (data: TData) => TData;
}

export function createQuery<TData, TParams = any, TParent = any>(
  opts: CreateQueryOptions<TData, TParams, TParent>
) {
  const { endpoint, initial, parent, findInParent, takeFirst, map, middleware } = opts;
  const pKey = `parent-${endpoint}`;
  const sg = ssrSignal<TData>(initial, parent ? pKey : endpoint);

  async function fetch(params: TParams = {} as TParams): Promise<TData> {
    if (parent && findInParent) {
      const found = findInParent(parent.v, params);
      if (found != null) {
        sg.v = found;
        return found;
      }
    }

    try {
      const resp = await instance.get(endpoint, { params });

      let raw = takeFirst ? resp.data?.[0] : resp.data;
      let result = map ? map(raw, resp, params) : (raw ?? initial);

      if (middleware) {
        result = middleware(result);
      }

      sg.v = result;
      return result;
    } catch (err) {
      console.error(`Query error (${endpoint}):`, err);
      return sg.v;
    }
  }

  return { sg, fetch };
}

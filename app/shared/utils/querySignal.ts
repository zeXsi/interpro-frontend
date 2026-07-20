// querySignal.ts
import { instance } from 'api/api.config';
import { ssrSignal, type SSRSignal } from './_stm';

const isServer = typeof window === 'undefined';

/** Мусор в env не должен молча отключать кэш: NaN > 0 === false. */
function envMs(name: string, fallback: number) {
  // process нет в браузере, а модуль грузится и на клиенте. Кэш всё равно
  // только серверный (isServer), поэтому на клиенте значение не используется.
  if (!isServer || typeof process === 'undefined' || !process.env) return fallback;

  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(`${name}="${raw}" не число — используем ${fallback}`);
    return fallback;
  }

  return parsed;
}

const DEFAULT_TTL_MS = envMs('SSR_QUERY_TTL_MS', 30 * 60_000);

/**
 * Сколько ещё отдавать протухшие данные, пока в фоне идёт обновление.
 * Апстрим WP API отвечает секундами, поэтому без этого окна каждый
 * протухший ключ заставлял бы живого пользователя ждать полный ответ API.
 */
const DEFAULT_SWR_MS = envMs('SSR_QUERY_SWR_MS', 10 * 60_000);

/** Ключи включают params, поэтому в долгоживущем процессе нужен потолок. */
const MAX_CACHE_ENTRIES = 500;
const CLEANUP_INTERVAL_MS = 60_000;

type CacheEntry = { expiresAt: number; staleUntil: number; data: unknown };

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

let lastCleanup = 0;

function cleanupExpired(force = false) {
  const now = Date.now();
  if (!force && now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of cache) {
    if (entry.staleUntil <= now) cache.delete(key);
  }

  // Map хранит ключи в порядке вставки — вытесняем самые давние.
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

// Ключ должен быть стабилен при разном порядке полей в params.
function cacheKey(endpoint: string, params: unknown) {
  const sorted =
    params && typeof params === 'object' && !Array.isArray(params)
      ? Object.fromEntries(Object.entries(params as object).sort(([a], [b]) => a.localeCompare(b)))
      : params;

  return `${endpoint}?${JSON.stringify(sorted ?? {})}`;
}

interface CreateQueryOptions<TData, TParams = any, TParent = any> {
  endpoint: string;
  initial: TData;
  parent?: SSRSignal<TParent>;
  findInParent?: (parent: TParent, params: TParams) => TData | null | undefined;
  takeFirst?: boolean;
  map?: (data: any, resp: any, params: TParams) => TData;
  middleware?: (data: TData) => TData;
  /** Время жизни SSR-кэша в мс. 0 отключает кэш для этого запроса. */
  ttlMs?: number;
  /** Окно, в котором протухшие данные отдаются сразу, а обновление идёт в фоне. */
  swrMs?: number;
}

export function createQuery<TData, TParams = any, TParent = any>(
  opts: CreateQueryOptions<TData, TParams, TParent>
) {
  const { endpoint, initial, parent, findInParent, takeFirst, map, middleware } = opts;
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const swrMs = opts.swrMs ?? DEFAULT_SWR_MS;
  const pKey = `parent-${endpoint}`;
  const sg = ssrSignal<TData>(initial, parent ? pKey : endpoint);

  async function request(params: TParams): Promise<TData> {
    const resp = await instance.get(endpoint, { params });

    const raw = takeFirst ? resp.data?.[0] : resp.data;
    let result = map ? map(raw, resp, params) : (raw ?? initial);

    if (middleware) {
      result = middleware(result);
    }

    return result;
  }

  async function fetch(params: TParams = {} as TParams): Promise<TData> {
    if (parent && findInParent) {
      const found = findInParent(parent.v, params);
      if (found != null) {
        sg.v = found;
        return found;
      }
    }

    const useCache = isServer && ttlMs > 0;
    const key = useCache ? cacheKey(endpoint, params) : '';

    if (useCache) {
      const now = Date.now();
      const hit = cache.get(key);

      if (hit && hit.expiresAt > now) {
        sg.v = hit.data as TData;
        return hit.data as TData;
      }

      if (hit && hit.staleUntil > now) {
        // Протухло, но ещё в SWR-окне: отдаём как есть, обновляем в фоне.
        // catch обязателен: фоновая ошибка иначе всплывёт как unhandled rejection.
        void refresh(key, params).catch((err) => {
          console.error(`Background refresh failed (${endpoint}):`, err);
        });
        sg.v = hit.data as TData;
        return hit.data as TData;
      }

      // Схлопываем параллельные одинаковые запросы в один поход в сеть.
      const pending = inFlight.get(key);
      if (pending) {
        try {
          const data = (await pending) as TData;
          sg.v = data;
          return data;
        } catch (err) {
          console.error(`Query error (${endpoint}):`, err);
          return fallback(useCache, key);
        }
      }
    }

    try {
      const result = useCache ? ((await refresh(key, params)) as TData) : await request(params);
      sg.v = result;
      return result;
    } catch (err) {
      // Ошибки не кэшируем — следующий запрос попробует сеть заново.
      console.error(`Query error (${endpoint}):`, err);
      return fallback(useCache, key);
    }
  }

  /**
   * sg — синглтон, общий для всех параллельных SSR-запросов, поэтому на сервере
   * его значение может принадлежать чужим params. Берём последнее известное
   * значение именно для этого ключа. На клиенте кэша нет и sg.v корректен.
   */
  function fallback(useCache: boolean, key: string): TData {
    if (!useCache) return sg.v;

    const stale = cache.get(key);
    return stale ? (stale.data as TData) : initial;
  }

  /** Один сетевой поход на ключ: пишет в кэш, дедуплицирует параллельные вызовы. */
  function refresh(key: string, params: TParams): Promise<TData> {
    const existing = inFlight.get(key) as Promise<TData> | undefined;
    if (existing) return existing;

    const promise = request(params)
      .then((result) => {
        const now = Date.now();
        cache.set(key, { expiresAt: now + ttlMs, staleUntil: now + ttlMs + swrMs, data: result });
        cleanupExpired(cache.size > MAX_CACHE_ENTRIES);
        return result;
      })
      .finally(() => {
        inFlight.delete(key);
      });

    inFlight.set(key, promise);

    return promise;
  }

  return { sg, fetch };
}

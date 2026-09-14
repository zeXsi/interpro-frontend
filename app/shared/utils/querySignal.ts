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
const DEFAULT_PRIME_TIMEOUT_MS = envMs('SSR_QUERY_PRIME_TIMEOUT_MS', 10_000);

/** Ключи включают params, поэтому в долгоживущем процессе нужен потолок. */
const MAX_CACHE_ENTRIES = 500;
const CLEANUP_INTERVAL_MS = 60_000;

type CacheEntry = { expiresAt: number; staleUntil: number; data: unknown };

type VersionedCacheEntry = CacheEntry & {
  family: string;
  generation: number;
  ttlMs: number;
  swrMs: number;
};

type PendingRequest = {
  generation: number;
  promise: Promise<unknown>;
};

const cache = new Map<string, VersionedCacheEntry>();
const inFlight = new Map<string, PendingRequest>();
const familyGenerations = new Map<string, number>();
const signalGenerations = new WeakMap<SSRSignal<unknown>, number>();

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
  /** Группа связанных cache keys, которые обновляются одним событием polling. */
  family?: string;
  initial: TData;
  parent?: SSRSignal<TParent>;
  findInParent?: (parent: TParent, params: TParams) => TData | null | undefined;
  takeFirst?: boolean;
  map?: (data: any, resp: any, params: TParams) => TData;
  middleware?: (data: TData) => TData;
  /**
   * Ключ SSR-состояния. Нужен, когда на один endpoint приходится несколько
   * запросов: по умолчанию ключ берётся из endpoint, и такие запросы затирали
   * бы состояние друг друга в __SSR_STATE__.
   */
  stateKey?: string;
  /** Время жизни SSR-кэша в мс. 0 отключает кэш для этого запроса. */
  ttlMs?: number;
  /** Окно, в котором протухшие данные отдаются сразу, а обновление идёт в фоне. */
  swrMs?: number;
}

export function createQuery<TData, TParams = any, TParent = any>(
  opts: CreateQueryOptions<TData, TParams, TParent>
) {
  const { endpoint, initial, parent, findInParent, takeFirst, map, middleware } = opts;
  const family = opts.family ?? endpoint;
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const swrMs = opts.swrMs ?? DEFAULT_SWR_MS;
  const stateKey = opts.stateKey ?? (parent ? `parent-${endpoint}` : endpoint);
  const sg = ssrSignal<TData>(initial, stateKey);

  async function request(params: TParams, timeout?: number): Promise<TData> {
    const resp = await instance.get(endpoint, { params, timeout });

    const raw = takeFirst ? resp.data?.[0] : resp.data;
    let result = map ? map(raw, resp, params) : (raw ?? initial);

    if (middleware) {
      result = middleware(result);
    }

    return result;
  }

  async function fetch(params: TParams = {} as TParams): Promise<TData> {
    const generation = getFamilyGeneration(family);

    // На сервере parent signal является process-wide singleton. После обновления
    // family используем его только когда он точно заполнен тем же поколением.
    const canUseParent =
      parent &&
      findInParent &&
      (!isServer || signalGenerations.get(parent as SSRSignal<unknown>) === generation);

    if (canUseParent) {
      const found = findInParent(parent.v, params);
      if (found != null) {
        setSignal(found, generation);
        return found;
      }
    }

    const useCache = isServer && ttlMs > 0;
    const key = useCache ? cacheKey(endpoint, params) : '';

    if (useCache) {
      const now = Date.now();
      const hit = cache.get(key);

      if (hit && hit.generation === generation && hit.expiresAt > now) {
        setSignal(hit.data as TData, hit.generation);
        return hit.data as TData;
      }

      if (hit && hit.staleUntil > now) {
        // Протухло, но ещё в SWR-окне: отдаём как есть, обновляем в фоне.
        // catch обязателен: фоновая ошибка иначе всплывёт как unhandled rejection.
        void refresh(key, params, generation).catch((err) => {
          console.error(`Background refresh failed (${endpoint}):`, err);
        });
        setSignal(hit.data as TData, hit.generation);
        return hit.data as TData;
      }

      // Схлопываем параллельные одинаковые запросы в один поход в сеть.
      const pending = inFlight.get(key);
      if (pending?.generation === generation) {
        try {
          const data = (await pending.promise) as TData;
          setSignal(data, generation);
          return data;
        } catch (err) {
          console.error(`Query error (${endpoint}):`, err);
          return fallback(useCache, key);
        }
      }
    }

    try {
      const result = useCache
        ? ((await refresh(key, params, generation)) as TData)
        : await request(params);
      setSignal(result, generation);
      return result;
    } catch (err) {
      // Ошибки не кэшируем — следующий запрос попробует сеть заново.
      console.error(`Query error (${endpoint}):`, err);
      return fallback(useCache, key);
    }
  }

  /** Заполняет server cache, не изменяя process-wide SSR signal. */
  async function prime(
    params: TParams = {} as TParams,
    options: { force?: boolean; updateSignal?: boolean } = {}
  ): Promise<TData> {
    const useCache = isServer && ttlMs > 0;
    if (!useCache) return request(params);

    const generation = getFamilyGeneration(family);
    const key = cacheKey(endpoint, params);
    const hit = cache.get(key);

    if (!options.force && hit?.generation === generation && hit.expiresAt > Date.now()) {
      if (options.updateSignal) setSignal(hit.data as TData, generation);
      return hit.data as TData;
    }

    const result = await refresh(key, params, generation, DEFAULT_PRIME_TIMEOUT_MS);
    if (options.updateSignal && getFamilyGeneration(family) === generation) {
      setSignal(result, generation);
    }
    return result;
  }

  /**
   * sg — синглтон, общий для всех параллельных SSR-запросов, поэтому на сервере
   * его значение может принадлежать чужим params. Берём последнее известное
   * значение именно для этого ключа. На клиенте кэша нет и sg.v корректен.
   */
  function fallback(useCache: boolean, key: string): TData {
    if (!useCache) return sg.v;

    const stale = cache.get(key);
    return stale && stale.staleUntil > Date.now() ? (stale.data as TData) : initial;
  }

  /** Один сетевой поход на ключ: пишет в кэш, дедуплицирует параллельные вызовы. */
  function refresh(
    key: string,
    params: TParams,
    generation: number,
    timeout?: number
  ): Promise<TData> {
    const existing = inFlight.get(key);
    if (existing?.generation === generation) return existing.promise as Promise<TData>;

    let pending: PendingRequest;
    const promise = request(params, timeout)
      .then((result) => {
        // Старый запрос, завершившийся после invalidation, не должен вернуть
        // устаревшее значение в новое поколение cache.
        if (getFamilyGeneration(family) === generation && inFlight.get(key) === pending) {
          const now = Date.now();
          cache.set(key, {
            family,
            generation,
            ttlMs,
            swrMs,
            expiresAt: now + ttlMs,
            staleUntil: now + ttlMs + swrMs,
            data: result,
          });
          cleanupExpired(cache.size > MAX_CACHE_ENTRIES);
        }
        return result;
      })
      .finally(() => {
        if (inFlight.get(key) === pending) inFlight.delete(key);
      });

    pending = { generation, promise };
    inFlight.set(key, pending);

    return promise;
  }

  function setSignal(data: TData, generation: number) {
    sg.v = data;
    signalGenerations.set(sg as SSRSignal<unknown>, generation);
  }

  return { sg, fetch, prime, family };
}

function getFamilyGeneration(family: string) {
  return familyGenerations.get(family) ?? 0;
}

export const isSsrQueryCacheEnabled = isServer && DEFAULT_TTL_MS > 0;

/** Мягко инвалидирует family: старые данные остаются fallback до успешного prime. */
export function invalidateSsrQueryFamily(family: string) {
  const generation = getFamilyGeneration(family) + 1;
  familyGenerations.set(family, generation);
  return generation;
}

/** Продлевает TTL только подтверждённых записей текущего поколения. */
export function touchSsrQueryFamily(family: string) {
  const generation = getFamilyGeneration(family);
  const now = Date.now();
  let touched = 0;

  for (const entry of cache.values()) {
    if (entry.family !== family || entry.generation !== generation) continue;
    entry.expiresAt = now + entry.ttlMs;
    entry.staleUntil = entry.expiresAt + entry.swrMs;
    touched += 1;
  }

  return touched;
}

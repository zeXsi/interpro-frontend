const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export type UtmPayload = Partial<Record<UtmKey, string>>;

const STORAGE_KEY = 'interpro_utm_params';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function readUtmFromLocation(): UtmPayload {
  if (!isBrowser()) return {};

  const params = new URLSearchParams(window.location.search);
  const result: UtmPayload = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value && value.trim()) {
      result[key] = value.trim();
    }
  }

  return result;
}

export function saveUtmToStorage(): void {
  if (!isBrowser()) return;

  const fresh = readUtmFromLocation();
  if (!Object.keys(fresh).length) return;

  const current = getStoredUtm();
  const merged = { ...current, ...fresh };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function getStoredUtm(): UtmPayload {
  if (!isBrowser()) return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const clean: UtmPayload = {};

    for (const key of UTM_KEYS) {
      const value = parsed[key];
      if (typeof value === 'string' && value.trim()) {
        clean[key] = value.trim();
      }
    }

    return clean;
  } catch {
    return {};
  }
}

export function withStoredUtm<T extends Record<string, any>>(payload: T): T & UtmPayload {
  return {
    ...payload,
    ...getStoredUtm(),
  };
}

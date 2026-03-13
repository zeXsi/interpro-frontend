import { createHash, randomUUID } from 'node:crypto';
import { instance } from 'api/api.config';
import type { Presentation } from 'api/presentation/presentation.types';

const PRESENTATION_PRIME_TTL_MS = 5 * 60 * 1000;
const PDF_CACHE_TTL_MS = 60 * 60 * 1000;
export const PDF_RENDER_VERSION = '2';

const primedPresentations = new Map<string, { expiresAt: number; data: Presentation }>();
const pdfCache = new Map<string, { expiresAt: number; data: Uint8Array }>();

function cleanupExpired() {
  const now = Date.now();

  for (const [key, entry] of primedPresentations) {
    if (entry.expiresAt <= now) {
      primedPresentations.delete(key);
    }
  }

  for (const [key, entry] of pdfCache) {
    if (entry.expiresAt <= now) {
      pdfCache.delete(key);
    }
  }
}

export async function fetchPresentation(slug: string): Promise<Presentation | null> {
  try {
    const response = await instance.get<Presentation>(
      `https://api.interpro.murukae.ru/wp-json/interpro/v1/presentations/${slug}/`
    );

    if (!response.data?.slides?.length) {
      return null;
    }

    return response.data;
  } catch {
    return null;
  }
}

export function getPresentationFingerprint(data: Presentation): string {
  return createHash('sha1').update(JSON.stringify(data)).digest('hex');
}

export function primePresentation(data: Presentation): string {
  cleanupExpired();

  const token = randomUUID();
  primedPresentations.set(token, {
    data,
    expiresAt: Date.now() + PRESENTATION_PRIME_TTL_MS,
  });

  return token;
}

export function getPrimedPresentation(token: string | null | undefined): Presentation | null {
  cleanupExpired();
  if (!token) return null;

  return primedPresentations.get(token)?.data ?? null;
}

export function getCachedPdf(cacheKey: string): Uint8Array | null {
  cleanupExpired();

  const entry = pdfCache.get(cacheKey);
  if (!entry) return null;

  return new Uint8Array(entry.data);
}

export function setCachedPdf(cacheKey: string, data: Uint8Array) {
  cleanupExpired();

  pdfCache.set(cacheKey, {
    data: new Uint8Array(data),
    expiresAt: Date.now() + PDF_CACHE_TTL_MS,
  });
}

export async function loadPresentationOrThrow(slug: string): Promise<Presentation> {
  const presentation = await fetchPresentation(slug);
  if (!presentation) {
    throw new Response('Not Found', { status: 404 });
  }

  return presentation;
}

export async function loadPrimedPresentationOrThrow(
  slug: string,
  token: string | null | undefined
): Promise<Presentation> {
  const primed = getPrimedPresentation(token);
  if (primed) {
    return primed;
  }

  return loadPresentationOrThrow(slug);
}

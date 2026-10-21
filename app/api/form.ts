import { instance } from './api.config';
import { withStoredUtm } from './utm';

export interface LeadData extends UtmFields {
  name: string;
  phone: string;
  company?: string;
  email?: string;
  consent: boolean;
  extraInfo?: string;
  terms?: string;
  area?: number;
  project?: string;
}

export interface LeadDataPopup extends UtmFields {
  name: string;
  phone: string;
  email: string;
  consent: boolean;
  extraInfo?: string;
}

export interface LeadDataExcursion extends UtmFields {
  name: string;
  phone: string;
  email: string;
  company: string;
  post: string;
  consent: boolean;
  extraInfo?: string;
}

export interface UtmFields {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface LeadResponse {
  ok: boolean;
  contactId?: number;
  companyId?: number;
  error?: string;
  /** Код ошибки бэкенда, например `lead_file_invalid` — тогда в `error` текст для пользователя. */
  code?: string;
}

/** Бэкенд отправляет заявку в CRM и почту синхронно — общих 3 с не хватает. */
const LEAD_TIMEOUT = 15_000;
/** Заявка с файлами: загрузка может идти долго на медленной сети. */
const LEAD_FILES_TIMEOUT = 60_000;

export async function sendLead(data: LeadData): Promise<LeadResponse> {
  try {
    const res = await instance.post<LeadResponse>(`/send`, withStoredUtm(data), { timeout: LEAD_TIMEOUT });
    return res.data;
  } catch (err: any) {
    console.error('Ошибка при отправке:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Заявка с вложениями: те же поля, что у sendLead, но multipart/form-data,
 * файлы — в `files[]`. Без файлов используйте sendLead (JSON).
 */
export async function sendLeadWithFiles(data: LeadData, files: File[]): Promise<LeadResponse> {
  if (!files.length) return sendLead(data);

  const formData = new FormData();
  for (const [key, value] of Object.entries(withStoredUtm(data))) {
    if (value === undefined || value === null) continue;
    formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  }
  for (const file of files) formData.append('files[]', file, file.name);

  try {
    const res = await instance.post<LeadResponse>(`/send`, formData, {
      timeout: LEAD_FILES_TIMEOUT,
      // Снимаем JSON-заголовок инстанса; Content-Type с boundary задаст браузер.
      headers: { 'Content-Type': undefined },
    });
    return res.data;
  } catch (err: any) {
    console.error('Ошибка при отправке:', err);
    const body = err?.response?.data;
    if (err?.response?.status === 400 && body?.code === 'lead_file_invalid' && typeof body.message === 'string') {
      return { ok: false, code: body.code, error: body.message };
    }
    return { ok: false, error: err.message };
  }
}

export async function sendLeadPopup(data: LeadDataPopup): Promise<LeadResponse> {
  try {
    const res = await instance.post<LeadResponse>(`/send-widget`, withStoredUtm(data), { timeout: LEAD_TIMEOUT });
    return res.data;
  } catch (err: any) {
    console.error('Ошибка при отправке:', err);
    return { ok: false, error: err.message };
  }
}

export async function sendExcursion(data: LeadDataExcursion): Promise<LeadResponse> {
  try {
    const res = await instance.post<LeadResponse>(`/send-excursion`, withStoredUtm(data), { timeout: LEAD_TIMEOUT });
    return res.data;
  } catch (err: any) {
    console.error('Ошибка при отправке:', err);
    return { ok: false, error: err.message };
  }
}

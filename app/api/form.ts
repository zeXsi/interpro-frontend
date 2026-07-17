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
}

export async function sendLead(data: LeadData): Promise<LeadResponse> {
  try {
    const res = await instance.post<LeadResponse>(`/send`, withStoredUtm(data));
    return res.data;
  } catch (err: any) {
    console.error('Ошибка при отправке:', err);
    return { ok: false, error: err.message };
  }
}

export async function sendLeadPopup(data: LeadDataPopup): Promise<LeadResponse> {
  try {
    const res = await instance.post<LeadResponse>(`/send-widget`, withStoredUtm(data));
    return res.data;
  } catch (err: any) {
    console.error('Ошибка при отправке:', err);
    return { ok: false, error: err.message };
  }
}

export async function sendExcursion(data: LeadDataExcursion): Promise<LeadResponse> {
  try {
    const res = await instance.post<LeadResponse>(`/send-excursion`, withStoredUtm(data));
    return res.data;
  } catch (err: any) {
    console.error('Ошибка при отправке:', err);
    return { ok: false, error: err.message };
  }
}

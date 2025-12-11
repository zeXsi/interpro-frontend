import { instance } from './api.config';

export interface LeadData {
  name: string;
  phone: string;
  company?: string;
  consent: boolean
}

export interface LeadDataPopup {
  name: string;
  phone: string;
  email: string;
  consent: boolean
}

export interface LeadDataExcursion {
  name: string;
  phone: string;
  email: string;
  company: string;
  post: string;
  consent: boolean
}

export interface LeadResponse {
  ok: boolean;
  contactId?: number;
  companyId?: number;
  error?: string;
}

export async function sendLead(data: LeadData): Promise<LeadResponse> {
  try {
    const res = await instance.post<LeadResponse>(`/send`, data);
    return res.data;
  } catch (err: any) {
    console.error('Ошибка при отправке:', err);
    return { ok: false, error: err.message };
  }
}


export async function sendLeadPopup(data: LeadDataPopup): Promise<LeadResponse> {
  try {
    const res = await instance.post<LeadResponse>(`/send-widget`, data);
    return res.data;
  } catch (err: any) {
    console.error('Ошибка при отправке:', err);
    return { ok: false, error: err.message };
  }
}


export async function sendExcursion(data: LeadDataExcursion): Promise<LeadResponse> {
  try {
    const res = await instance.post<LeadResponse>(`/send-excursion`, data);
    return res.data;
  } catch (err: any) {
    console.error('Ошибка при отправке:', err);
    return { ok: false, error: err.message };
  }
}

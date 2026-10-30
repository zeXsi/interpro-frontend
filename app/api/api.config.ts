import axios from 'axios';


export const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json; charset=UTF-8',
  
};

export const wpApiBaseURL = import.meta.env.VITE_BASE_URL;
export const interproApiBaseURL = new URL('/wp-json/interpro/v1', wpApiBaseURL).toString();

export const config = {
  headers: {
    ...headers,
  },
};

// В браузере список /projects (~320 КБ) на медленной сети не укладывается в 3 с,
// и таймаут превращался в пустой список. SSR оставляем с коротким таймаутом.
const REQUEST_TIMEOUT_MS = typeof window === 'undefined' ? 3000 : 20000;

export const instance = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  baseURL: wpApiBaseURL,
  // In local/SSR Node runtime axios picks up HTTP(S)_PROXY from env.
  // Our WordPress API should be requested directly, otherwise the proxy returns 400.
  proxy: false,
  ...config,
});



export const serializeParams = (params: object) => {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
};

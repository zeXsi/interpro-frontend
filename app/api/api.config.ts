import axios from 'axios';


export const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json; charset=UTF-8',
  
};

export const config = {
  headers: {
    ...headers,
  },
};

export const instance = axios.create({
  timeout: 3000,
  baseURL: import.meta.env.VITE_BASE_URL,
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

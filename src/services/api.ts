import axios from 'axios';
import { parseCookies } from 'nookies';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1939',
});

api.interceptors.request.use(
  (config) => {
    const { 'nextauth.token': token } = parseCookies();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { api };

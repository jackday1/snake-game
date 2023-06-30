import axios from 'axios';

import environments from '../utils/environments';
import { ACCESS_TOKEN } from '../utils/constants';

const { BACKEND_URL } = environments;

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (err) => {
    throw new Error((err.response && err.response.data) || err.message);
  }
);

export default api;

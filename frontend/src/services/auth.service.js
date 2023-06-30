import api from './api';

export const login = (data) => api.post('/api/v1/auth/login', data);

export const getMe = () => api.get('/api/v1/auth/me');

import api from '../lib/axios';

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const me = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

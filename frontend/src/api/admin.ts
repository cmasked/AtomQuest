import api from '../lib/axios';

export const getCycles = async () => {
  const response = await api.get('/admin/cycles');
  return response.data;
};

export const createCycle = async (data: any) => {
  const response = await api.post('/admin/cycles', data);
  return response.data;
};

export const activateCycle = async (id: string) => {
  const response = await api.patch(`/admin/cycles/${id}/activate`);
  return response.data;
};

export const updateCycle = async (id: string, data: any) => {
  const response = await api.patch(`/admin/cycles/${id}`, data);
  return response.data;
};

export const getCheckinCompletion = async (quarter: string) => {
  const response = await api.get('/admin/checkins/completion', { params: { quarter } });
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const updateUserRole = async (id: string, data: any) => {
  const response = await api.patch(`/admin/users/${id}/role`, data);
  return response.data;
};

export const unlockGoal = async (id: string) => {
  const response = await api.post(`/admin/goals/${id}/unlock`);
  return response.data;
};

export const createSharedGoal = async (data: any) => {
  const response = await api.post('/admin/goals/shared', data);
  return response.data;
};

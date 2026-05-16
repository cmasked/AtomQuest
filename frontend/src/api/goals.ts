import api from '../lib/axios';

export const getMyGoals = async () => {
  const response = await api.get('/goals/my');
  return response.data;
};

export const getTeamGoals = async () => {
  const response = await api.get('/goals/team');
  return response.data;
};

export const createGoal = async (data: any) => {
  const response = await api.post('/goals', data);
  return response.data;
};

export const updateGoal = async (id: string, data: any) => {
  const response = await api.patch(`/goals/${id}`, data);
  return response.data;
};

export const deleteGoal = async (id: string) => {
  const response = await api.delete(`/goals/${id}`);
  return response.data;
};

export const submitGoal = async (id: string) => {
  const response = await api.post(`/goals/${id}/submit`);
  return response.data;
};

export const approveGoal = async (id: string) => {
  const response = await api.post(`/goals/${id}/approve`);
  return response.data;
};

export const returnGoal = async (id: string, managerNote?: string) => {
  const response = await api.post(`/goals/${id}/return`, { managerNote });
  return response.data;
};

export const updateSharedWeightage = async (id: string, weightage: number) => {
  const response = await api.patch(`/goals/${id}/shared-weightage`, { weightage });
  return response.data;
};

import api from '../lib/axios';

export const saveCheckin = async (data: any) => {
  const response = await api.post('/checkins', data);
  return response.data;
};

export const getTeamCheckins = async () => {
  const response = await api.get('/checkins/team');
  return response.data;
};

export const getGoalCheckins = async (goalId: string) => {
  const response = await api.get(`/checkins/goal/${goalId}`);
  return response.data;
};

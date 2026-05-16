import api from '../lib/axios';

export const updateAchievement = async (goalId: string, quarter: string, data: any) => {
  const response = await api.patch(`/goals/${goalId}/achievement/${quarter}`, data);
  return response.data;
};

export const getAchievements = async (goalId: string) => {
  const response = await api.get(`/goals/${goalId}/achievements`);
  return response.data;
};

export const getMyAchievementSummary = async () => {
  const response = await api.get('/goals/my/achievements/summary');
  return response.data;
};

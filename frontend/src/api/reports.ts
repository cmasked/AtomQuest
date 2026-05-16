import api from '../lib/axios';

export const getAchievementReport = async (filters: any) => {
  const response = await api.get('/reports/achievement', { params: filters });
  return response.data;
};

export const exportAchievementReport = async (filters: any) => {
  const response = await api.get('/reports/achievement/export', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

export const getCompletionDashboard = async () => {
  const response = await api.get('/reports/completion-dashboard');
  return response.data;
};

export const getAuditLog = async (entityId: string) => {
  const response = await api.get(`/reports/audit/${entityId}`);
  return response.data;
};

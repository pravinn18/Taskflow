import api from "./axios";

export const getTaskActivities = async (taskId) => {
  const response = await api.get(`/activities/task/${taskId}`);

  return response.data;
};

export const getProjectActivities = async (projectId) => {
  const response = await api.get(`/activities/project/${projectId}`);

  return response.data;
};

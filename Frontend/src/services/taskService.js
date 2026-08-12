import axios from "./axios";

export const getProjectTasks = async (projectId) => {
  const response = await axios.get(`/api/tasks/project/${projectId}`);

  return response.data;
};

export const createTask = async (taskData) => {
  const response = await axios.post("/api/tasks", taskData);

  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await axios.put(`/api/tasks/${taskId}`, taskData);

  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await axios.patch(`/api/tasks/${taskId}/status`, { status });

  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await axios.delete(`/api/tasks/${taskId}`);

  return response.data;
};

import axios from "axios";

const api = axios.create({
  baseURL: "https://taskflow-dkyf.onrender.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

import axios from "axios";
const API_URL = "http://127.0.0.1:8000";

export const register = (username, password) =>
  axios.post(`${API_URL}/auth/register`, { username, password });

export const login = async (username, password) => {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  const res = await axios.post(`${API_URL}/auth/login`, params);
  localStorage.setItem("token", res.data.access_token);
  return res.data;
};

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${API_URL}/uploads/`, formData, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
};

export const runAnalysis = (filename) =>
  axios.get(`${API_URL}/analysis/`, {
    params: { filename },
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  export const getHistory = (skip = 0, limit = 10, sort = "desc") =>
    axios.get(`${API_URL}/analysis/history`, {
      params: { skip, limit, sort },
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
  
  export const getAnalysisDetail = (id) =>
    axios.get(`${API_URL}/analysis/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
  
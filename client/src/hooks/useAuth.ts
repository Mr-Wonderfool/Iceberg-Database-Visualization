import axios from "axios";

const API_URL = "http://localhost:8080/auth";

export const login = async (username: string, password: string) => {
  return axios.post(`${API_URL}/login`, {
    username: username,
    password: password,
  });
};

export const signup = async (
  username: string,
  password: string,
  email: string
) => {
  return axios.post(`${API_URL}/signup`, {
    username: username,
    password: password,
    email: email,
  });
};

export const isLoggedIn = () => {
  return localStorage.getItem("access_token") != null;
};

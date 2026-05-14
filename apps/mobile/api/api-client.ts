import axios from 'axios';
import { API_URL } from './config';
import { AuthService } from '../services/auth';

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

const apiClient = axios.create({
    baseURL: API_URL,
    headers:{
      'Content-Type': 'application/json'
    }
  });

apiClient.interceptors.response.use(
  response => response,
  async error => {
    console.log('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      await AuthService.deleteToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
)

apiClient.interceptors.request.use(async request => {
  const token = await AuthService.getToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
}, error => Promise.reject(error))


export default apiClient;
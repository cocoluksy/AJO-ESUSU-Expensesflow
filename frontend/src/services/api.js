import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// Add authorization token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (data) => API.post('/users/register', data),
  login: (data) => API.post('/users/login', data),
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data)
};

// Expense API calls
export const expenseAPI = {
  create: (data) => API.post('/expenses', data),
  getAll: (params) => API.get('/expenses', { params }),
  getById: (id) => API.get(`/expenses/${id}`),
  update: (id, data) => API.put(`/expenses/${id}`, data),
  delete: (id) => API.delete(`/expenses/${id}`)
};

// Category API calls
export const categoryAPI = {
  create: (data) => API.post('/categories', data),
  getAll: () => API.get('/categories'),
  getById: (id) => API.get(`/categories/${id}`),
  update: (id, data) => API.put(`/categories/${id}`, data),
  delete: (id) => API.delete(`/categories/${id}`)
};

// Report API calls
export const reportAPI = {
  getCategoryBreakdown: (params) => API.get('/reports/category-breakdown', { params }),
  getDailyTrend: (params) => API.get('/reports/daily-trend', { params }),
  getMonthlySummary: (params) => API.get('/reports/monthly-summary', { params }),
  getFinancialReport: (params) => API.get('/reports/financial-report', { params })
};

export const walletAPI = {
  get: () => API.get('/wallet'),
  addMoney: (data) => API.post('/wallet/add-money', data),
  cashOut: (data) => API.post('/wallet/cash-out', data),
  monitor: () => API.get('/wallet/monitor'),
  getSchedules: () => API.get('/wallet/payout-schedules'),
  createSchedule: (data) => API.post('/wallet/payout-schedules', data)
};

export const contributionAPI = {
  getPublicGroups: () => API.get('/contributions/groups/public'),
  getMyGroups: () => API.get('/contributions/groups/mine'),
  createGroup: (data) => API.post('/contributions/groups', data),
  joinGroup: (id) => API.post(`/contributions/groups/${id}/join`),
  exitGroup: (id) => API.post(`/contributions/groups/${id}/exit`),
  addContribution: (data) => API.post('/contributions/contributions', data),
  track: () => API.get('/contributions/track'),
  summary: (id) => API.get(`/contributions/groups/${id}/summary`),
  notifications: () => API.get('/contributions/notifications'),
  getPersonalSavings: () => API.get('/contributions/personal-savings'),
    savePersonalSavings: (data) => API.put('/contributions/personal-savings', data),
  addGuestMember: (groupId, data) => API.post(`/contributions/groups/${groupId}/members`, data),
  removeMember: (groupId, memberId) => API.delete(`/contributions/groups/${groupId}/members/${memberId}`),
  readdMember: (groupId, memberId) => API.post(`/contributions/groups/${groupId}/members/${memberId}/readd`),
  setPayoutDate: (groupId, memberId, data) => API.put(`/contributions/groups/${groupId}/members/${memberId}/payout-date`, data),
  getSavingsHistory: () => API.get('/contributions/personal-savings/history'),
  addSavingsEntry: (data) => API.post('/contributions/personal-savings/history', data),
  requestToJoin: (groupId) => API.post(`/contributions/groups/${groupId}/request-join`)
};

export default API;

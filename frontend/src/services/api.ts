import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const emsApi = {
  getEmployees: (filters?: any) => {
    const params = { ...filters };
    if (filters?.includeProjects) {
      params.includeProjects = 'true';
    }
    return api.get('/ems/employees', { params });
  },
  getEmployee: (id: string) => api.get(`/ems/employees/${id}`),
  createEmployee: (data: any) => api.post('/ems/employees', data),
  updateEmployee: (id: string, data: any) => api.put(`/ems/employees/${id}`, data),
  activateEmployee: (id: string) => api.post(`/ems/employees/${id}/activate`),
  deactivateEmployee: (id: string) => api.post(`/ems/employees/${id}/deactivate`),

      getProjects: (filters?: any) => api.get('/ems/projects', { params: filters }),
      getProject: (id: string) => api.get(`/ems/projects/${id}`),
      createProject: (data: any) => api.post('/ems/projects', data),
      updateProject: (id: string, data: any) => api.put(`/ems/projects/${id}`, data),
      deleteProject: (id: string, force?: boolean) => api.delete(`/ems/projects/${id}`, { data: { force } }),
      assignEmployee: (data: any) => api.post('/ems/projects/assign', data),
      updateEmployeeAssignment: (id: string, data: any) => api.put(`/ems/projects/assignments/${id}`, data),
      relocateEmployee: (id: string, data: { newProjectId: string; notes?: string }) => api.post(`/ems/projects/assignments/${id}/relocate`, data),

  getEmployeeExperience: (employeeId: string) => api.get(`/ems/employees/${employeeId}/experience`),
  createExperience: (data: any) => api.post('/ems/experience', data),
  updateExperience: (id: string, data: any) => api.put(`/ems/experience/${id}`, data),
  deleteExperience: (id: string) => api.delete(`/ems/experience/${id}`),

  getEmployeeTimeline: (employeeId: string) => api.get(`/ems/employees/${employeeId}/timeline`),
  getEmployeeTimelineGrouped: (employeeId: string) => api.get(`/ems/employees/${employeeId}/timeline/grouped`),

  getCategories: (includeInactive?: boolean) => api.get('/ems/categories', { params: { includeInactive } }),
  createCategory: (data: any) => api.post('/ems/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/ems/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/ems/categories/${id}`),

  getDashboardStats: () => api.get('/ems/admin/dashboard'),
  getAuditLogs: (filters?: any) => api.get('/ems/admin/audit-logs', { params: filters }),
  exportEmployees: (filters?: any) => api.get('/ems/admin/export/employees', { params: filters, responseType: 'blob' }),
};

export const pmsApi = {
  createSnapshot: (data: any) => api.post('/pms/snapshots', data),
  getEmployeeSnapshots: (employeeId: string, filters?: any) =>
    api.get(`/pms/employees/${employeeId}/snapshots`, { params: filters }),

  createMetric: (data: any) => api.post('/pms/metrics', data),
  getEmployeeMetrics: (employeeId: string, filters?: any) =>
    api.get(`/pms/employees/${employeeId}/metrics`, { params: filters }),

  createOrUpdateSummary: (data: any) => api.post('/pms/summaries', data),
  getEmployeeSummaries: (employeeId: string, filters?: any) =>
    api.get(`/pms/employees/${employeeId}/summaries`, { params: filters }),
  getEmployeeSummary: (employeeId: string, summaryDate?: Date) =>
    api.get(`/pms/employees/${employeeId}/summary`, { params: { summaryDate } }),

  getEmployeePerformanceOverview: (employeeId: string) =>
    api.get(`/pms/employees/${employeeId}/overview`),
  getPerformanceTrend: (employeeId: string, months?: number) =>
    api.get(`/pms/employees/${employeeId}/trend`, { params: { months } }),
  getCategoryWiseContribution: (employeeId: string) =>
    api.get(`/pms/employees/${employeeId}/category-contribution`),
  getTimeSpentPerProject: (employeeId: string) =>
    api.get(`/pms/employees/${employeeId}/project-time`),
  getSkillGrowthOverTime: (employeeId: string) =>
    api.get(`/pms/employees/${employeeId}/skill-growth`),
  getAdminDashboardAnalytics: (filters?: any) =>
    api.get('/pms/admin/dashboard-analytics', { params: filters }),

  getConfig: (key: string) => api.get(`/pms/config/${key}`),
  setConfig: (key: string, value: any) => api.put(`/pms/config/${key}`, { value }),
  getAllConfigs: (category?: string) => api.get('/pms/config', { params: { category } }),
};

export const authApi = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  register: (data: any) => api.post('/auth/register', data),
  verify: () => api.get('/auth/verify'),
};

export const attendanceApi = {
  markAttendance: (data: any) => api.post('/attendance/mark', data),
  updateAttendance: (id: string, data: any) => api.put(`/attendance/${id}`, data),
  getEmployeeAttendance: (employeeId: string, filters?: any) =>
    api.get(`/attendance/employees/${employeeId}`, { params: filters }),
  getEmployeeHistory: (employeeId: string, days?: number) =>
    api.get(`/attendance/employees/${employeeId}/history`, { params: { days } }),
  getAttendanceStats: (employeeId: string, filters?: any) =>
    api.get(`/attendance/employees/${employeeId}/stats`, { params: filters }),
  getAllEmployeesAttendance: (filters?: any) =>
    api.get('/attendance/all', { params: filters }),
  getAttendanceByProject: (projectId: string, filters?: any) =>
    api.get(`/attendance/projects/${projectId}`, { params: filters }),
};

export const ticketApi = {
  createTicket: (data: any) => api.post('/tickets/tickets', data),
  getAllTickets: (filters?: any) => api.get('/tickets/tickets', { params: filters }),
  getEmployeeTickets: (employeeId: string) => api.get(`/tickets/employees/${employeeId}/tickets`),
  updateTicket: (id: string, data: any) => api.put(`/tickets/tickets/${id}`, data),
};

export const customFieldApi = {
  addCustomField: (employeeId: string, data: any) => api.post(`/ems/employees/${employeeId}/custom-fields`, data),
  getCustomFields: (employeeId: string) => api.get(`/ems/employees/${employeeId}/custom-fields`),
  updateCustomField: (id: string, data: any) => api.put(`/ems/custom-fields/${id}`, data),
  deleteCustomField: (id: string) => api.delete(`/ems/custom-fields/${id}`),
};

export default api;


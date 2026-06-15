import request from '../utils/request';

export interface LoginParams {
  username: string;
  password: string;
  role: number;
}

export interface UserInfo {
  id: number;
  username: string;
  realName: string;
  role: number;
  avatar?: string;
  email?: string;
  phone?: string;
}

export interface LoginResult {
  token: string;
  userInfo: UserInfo;
}

export const authApi = {
  login: (data: LoginParams) => request.post<LoginResult>('/auth/login', data),
  register: (data: any) => request.post('/auth/register', data),
  current: () => request.get<UserInfo>('/auth/current'),
};

export const userApi = {
  students: (keyword?: string) => request.get('/users/students', { params: { keyword } }),
  subjects: () => request.get<string[]>('/users/subjects'),
  detail: (id: number) => request.get<UserInfo>(`/users/${id}`),
};

export const questionApi = {
  create: (data: any) => request.post('/questions', data),
  update: (id: number, data: any) => request.put(`/questions/${id}`, data),
  delete: (id: number) => request.delete(`/questions/${id}`),
  detail: (id: number) => request.get(`/questions/${id}`),
  list: (data: any) => request.post('/questions/list', data),
  types: () => request.get('/questions/types'),
  difficulties: () => request.get('/questions/difficulties'),
};

export const knowledgeApi = {
  tree: (subject?: string) => request.get('/knowledge/tree', { params: { subject } }),
  list: (subject?: string) => request.get('/knowledge/list', { params: { subject } }),
  create: (data: any) => request.post('/knowledge', data),
  update: (id: number, data: any) => request.put(`/knowledge/${id}`, data),
  delete: (id: number) => request.delete(`/knowledge/${id}`),
};

export const paperApi = {
  create: (data: any) => request.post('/papers', data),
  list: (params?: any) => request.get('/papers', { params }),
  detail: (id: number) => request.get(`/papers/${id}`),
  publish: (id: number) => request.put(`/papers/${id}/publish`),
  delete: (id: number) => request.delete(`/papers/${id}`),
  questions: (id: number) => request.get(`/papers/${id}/questions`),
};

export const examApi = {
  create: (data: any) => request.post('/exams', data),
  list: () => request.get('/exams'),
  detail: (id: number) => request.get(`/exams/${id}`),
  start: (id: number) => request.post(`/exams/${id}/start`),
  submit: (data: any) => request.post('/exams/submit', data),
  result: (examStudentId: number) => request.get(`/exams/result/${examStudentId}`),
  students: (id: number) => request.get(`/exams/${id}/students`),
};

export const wrongBookApi = {
  list: (params?: any) => request.get('/wrong-book', { params }),
  markMastered: (id: number) => request.put(`/wrong-book/${id}/master`),
  count: () => request.get('/wrong-book/count'),
};

export const studyApi = {
  dashboard: () => request.get('/study/dashboard'),
  knowledgeAnalysis: () => request.get('/study/knowledge-analysis'),
  recommend: (limit = 20) => request.get('/study/recommend', { params: { limit } }),
};

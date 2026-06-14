export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'expert' | 'attending' | 'resident' | 'technician';
  avatar?: string;
  department?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const RoleLabels: Record<string, string> = {
  expert: '专家医生',
  attending: '主治医生',
  resident: '住院医生',
  technician: '技师'
};

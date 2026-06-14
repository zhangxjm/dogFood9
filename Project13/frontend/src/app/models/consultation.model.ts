export type ConsultationStatus = 'pending' | 'in_progress' | 'completed';

export interface Consultation {
  id: number;
  title: string;
  studyId: number;
  patientId: number;
  patientName: string;
  description: string;
  initiatorId: number;
  initiatorName: string;
  expertIds: number[];
  expertNames: string[];
  status: ConsultationStatus;
  comments: ConsultationComment[];
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationComment {
  id: number;
  consultationId: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
}

export interface ConsultationCreateRequest {
  title: string;
  studyId: number;
  description: string;
  expertIds: number[];
}

export const ConsultationStatusLabels: Record<ConsultationStatus, string> = {
  pending: '待会诊',
  in_progress: '会诊中',
  completed: '已完成'
};

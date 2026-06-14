export interface Patient {
  id: number;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  idCard?: string;
  phone?: string;
  address?: string;
  medicalRecordNo: string;
  allergyHistory?: string;
  studyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatientCreateRequest {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  idCard?: string;
  phone?: string;
  address?: string;
  medicalRecordNo: string;
  allergyHistory?: string;
}

export const GenderLabels: Record<string, string> = {
  male: '男',
  female: '女'
};

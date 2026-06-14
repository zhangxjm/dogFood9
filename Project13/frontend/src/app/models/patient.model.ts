export interface Patient {
  id: number;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  idNumber?: string;
  phone?: string;
  address?: string;
  medicalRecordNumber: string;
  allergies?: string;
  studyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatientCreateRequest {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  idNumber?: string;
  phone?: string;
  address?: string;
  medicalRecordNumber: string;
  allergies?: string;
}

export const GenderLabels: Record<string, string> = {
  male: '男',
  female: '女'
};

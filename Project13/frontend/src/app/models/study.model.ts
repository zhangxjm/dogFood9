export type StudyStatus = 'pending' | 'analyzing' | 'completed';

export interface Study {
  id: number;
  patientId: number;
  patientName: string;
  studyDate: string;
  studyType: string;
  bodyPart: string;
  description?: string;
  status: StudyStatus;
  dicomFileCount: number;
  noduleCount: number;
  createdAt: string;
}

export interface StudyCreateRequest {
  patientId: number;
  studyType: string;
  bodyPart: string;
  description?: string;
}

export const StudyStatusLabels: Record<StudyStatus, string> = {
  pending: '待分析',
  analyzing: '分析中',
  completed: '完成'
};

export const StudyTypeOptions = [
  { value: 'ct_chest', label: '胸部CT' },
  { value: 'ct_lung_hr', label: '肺部高分辨率CT' },
  { value: 'ct_lung_ld', label: '肺部低剂量CT' },
  { value: 'ct_enhanced', label: '增强CT' }
];

export const BodyPartOptions = [
  { value: 'lung', label: '肺部' },
  { value: 'chest', label: '胸部' },
  { value: 'mediastinum', label: '纵隔' }
];

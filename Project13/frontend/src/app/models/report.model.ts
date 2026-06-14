export type ReportStatus = 'unsigned' | 'signed';

export interface Report {
  id: number;
  studyId: number;
  patientId: number;
  patientName: string;
  reportType: string;
  findings: string;
  conclusion: string;
  recommendations: string;
  nodules: ReportNodule[];
  status: ReportStatus;
  signedBy?: string;
  signedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportNodule {
  noduleId: number;
  noduleType: string;
  size: number;
  malignancyLevel: string;
  malignancyProbability: number;
  description: string;
}

export interface ReportCreateRequest {
  studyId: number;
  reportType: string;
  findings: string;
  conclusion: string;
  recommendations: string;
}

export const ReportStatusLabels: Record<ReportStatus, string> = {
  unsigned: '未签署',
  signed: '已签署'
};

export const ReportTypeOptions = [
  { value: 'ct_diagnosis', label: 'CT诊断报告' },
  { value: 'screening', label: '筛查报告' },
  { value: 'follow_up', label: '随访报告' }
];

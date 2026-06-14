export type MalignancyLevel = 'benign' | 'possibly_benign' | 'uncertain' | 'possibly_malignant' | 'malignant';
export type DetectionMethod = 'ai' | 'manual' | 'ai_manual';

export interface Nodule {
  id: number;
  studyId: number;
  noduleType: string;
  size: number;
  volume: number;
  density: number;
  marginFeature: string;
  malignancyProbability: number;
  malignancyLevel: MalignancyLevel;
  detectionMethod: DetectionMethod;
  bboxX: number;
  bboxY: number;
  bboxWidth: number;
  bboxHeight: number;
  sliceIndex: number;
  description?: string;
  createdAt: string;
}

export const MalignancyLevelLabels: Record<MalignancyLevel, string> = {
  benign: '良性',
  possibly_benign: '可能良性',
  uncertain: '不确定',
  possibly_malignant: '可能恶性',
  malignant: '恶性'
};

export const MalignancyLevelCssClass: Record<MalignancyLevel, string> = {
  benign: 'benign',
  possibly_benign: 'possibly-benign',
  uncertain: 'uncertain',
  possibly_malignant: 'possibly-malignant',
  malignant: 'malignant'
};

export const DetectionMethodLabels: Record<DetectionMethod, string> = {
  ai: 'AI检测',
  manual: '人工标注',
  ai_manual: 'AI+人工'
};

export const NoduleTypeOptions = [
  { value: 'solid', label: '实性结节' },
  { value: 'ground_glass', label: '磨玻璃结节' },
  { value: 'part_solid', label: '部分实性结节' },
  { value: 'calcified', label: '钙化结节' }
];

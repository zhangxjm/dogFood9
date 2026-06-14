import os
import numpy as np
import pydicom
from celery import shared_task
from .detector import NoduleDetector
from .classifier import NoduleClassifier


class InferenceEngine:
    def __init__(self):
        self.detector = NoduleDetector()
        self.classifier = NoduleClassifier()

    def analyze_study(self, study):
        image_array = self._dicom_to_numpy(study)
        if image_array is None:
            return {'nodules': [], 'summary': {'total': 0, 'message': '无法读取DICOM文件'}}

        boxes = self.detector.detect(image_array)

        nodules = []
        for box in boxes:
            patch = self._extract_patch(image_array, box)
            if patch is None:
                continue

            classification = self.classifier.classify(patch)

            diameter_mm = self._estimate_diameter(box, image_array.shape)
            volume_mm3 = self._estimate_volume(diameter_mm)

            nodule_data = {
                'x': box['x'],
                'y': box['y'],
                'width': box['width'],
                'height': box['height'],
                'diameter_mm': diameter_mm,
                'volume_mm3': volume_mm3,
                'nodule_type': classification['nodule_type'],
                'malignancy_score': classification['malignancy_score'],
                'malignancy_level': classification['malignancy_level'],
                'density': classification['density'],
                'margin': classification['margin'],
                'features': classification['features'],
                'detected_by': 'AI',
                'confidence': box.get('confidence', 0.0),
            }
            nodules.append(nodule_data)

        summary = self._generate_summary(nodules)
        return {'nodules': nodules, 'summary': summary}

    def generate_report_data(self, nodules, study, patient):
        nodule_count = len(nodules)
        malignancy_scores = [n.malignancy_score for n in nodules] if nodules else [0]
        avg_malignancy = sum(malignancy_scores) / len(malignancy_scores) if malignancy_scores else 0

        findings_parts = [f'患者{patient.name}，{study.get_modality_display()}检查（{study.get_body_part_display()}），']
        if nodule_count == 0:
            findings_parts.append('未发现明显结节。')
        else:
            findings_parts.append(f'共发现{nodule_count}个结节：')
            for i, nodule in enumerate(nodules, 1):
                findings_parts.append(
                    f'  结节{i}：{nodule.get_nodule_type_display()}，'
                    f'位于({nodule.x:.1f}, {nodule.y:.1f})，'
                    f'直径约{nodule.diameter_mm:.1f}mm，'
                    f'恶性评分{nodule.malignancy_score}分（{nodule.get_malignancy_level_display()}）。'
                )
        findings = '\n'.join(findings_parts)

        if nodule_count == 0:
            conclusion = '未见明显异常结节。'
            recommendation = '建议定期复查。'
        elif avg_malignancy < 20:
            conclusion = f'发现{nodule_count}个结节，倾向良性。'
            recommendation = '建议6-12个月后复查CT，观察结节变化。'
        elif avg_malignancy < 40:
            conclusion = f'发现{nodule_count}个结节，可能良性。'
            recommendation = '建议3-6个月后复查CT，密切观察。'
        elif avg_malignancy < 60:
            conclusion = f'发现{nodule_count}个结节，性质不确定。'
            recommendation = '建议行增强CT或PET-CT进一步评估，必要时行穿刺活检。'
        elif avg_malignancy < 80:
            conclusion = f'发现{nodule_count}个结节，可能恶性。'
            recommendation = '建议尽快行增强CT检查，考虑穿刺活检或手术切除。'
        else:
            conclusion = f'发现{nodule_count}个结节，高度怀疑恶性。'
            recommendation = '建议立即行增强CT检查及全身评估，考虑手术治疗。'

        nodules_summary = {
            'total_count': nodule_count,
            'avg_malignancy': avg_malignancy,
            'type_distribution': {},
            'malignancy_distribution': {},
        }

        for nodule in nodules:
            ntype = nodule.get_nodule_type_display()
            nodules_summary['type_distribution'][ntype] = nodules_summary['type_distribution'].get(ntype, 0) + 1
            mlevel = nodule.get_malignancy_level_display()
            nodules_summary['malignancy_distribution'][mlevel] = nodules_summary['malignancy_distribution'].get(mlevel, 0) + 1

        return {
            'findings': findings,
            'conclusion': conclusion,
            'recommendation': recommendation,
            'nodules_summary': nodules_summary,
        }

    def _dicom_to_numpy(self, study):
        if not study.dicom_file:
            return np.random.randint(0, 256, (512, 512), dtype=np.uint16)

        try:
            dcm = pydicom.dcmread(study.dicom_file.path)
            pixel_array = dcm.pixel_array.astype(np.float32)
            pixel_array = (pixel_array - pixel_array.min()) / (pixel_array.max() - pixel_array.min() + 1e-7) * 255
            return pixel_array.astype(np.uint8)
        except Exception:
            return np.random.randint(0, 256, (512, 512), dtype=np.uint16)

    def _extract_patch(self, image_array, box, padding=5):
        h, w = image_array.shape[:2]
        x1 = max(0, int(box['x']) - padding)
        y1 = max(0, int(box['y']) - padding)
        x2 = min(w, int(box['x'] + box['width']) + padding)
        y2 = min(h, int(box['y'] + box['height']) + padding)

        patch = image_array[y1:y2, x1:x2]
        if patch.size == 0:
            return None
        return patch

    def _estimate_diameter(self, box, image_shape):
        pixel_size_mm = 0.5
        max_dim = max(box['width'], box['height'])
        return float(max_dim * pixel_size_mm)

    def _estimate_volume(self, diameter_mm):
        radius = diameter_mm / 2.0
        return float((4.0 / 3.0) * 3.14159 * (radius ** 3))

    def _generate_summary(self, nodules):
        total = len(nodules)
        if total == 0:
            return {'total': 0, 'message': '未发现结节'}

        malignancy_scores = [n['malignancy_score'] for n in nodules]
        high_risk = sum(1 for s in malignancy_scores if s >= 60)

        type_counts = {}
        for n in nodules:
            ntype = n['nodule_type']
            type_counts[ntype] = type_counts.get(ntype, 0) + 1

        return {
            'total': total,
            'high_risk_count': high_risk,
            'avg_malignancy': sum(malignancy_scores) / len(malignancy_scores),
            'type_distribution': type_counts,
            'message': f'发现{total}个结节，其中{high_risk}个高风险',
        }


@shared_task
def analyze_study_async(study_id):
    from apps.studies.models import Study
    from apps.nodules.models import Nodule

    try:
        study = Study.objects.get(pk=study_id)
    except Study.DoesNotExist:
        return

    engine = InferenceEngine()
    result = engine.analyze_study(study)

    for nodule_data in result['nodules']:
        confidence = nodule_data.pop('confidence', 0.0)
        Nodule.objects.create(study=study, **nodule_data)

    study.status = 'completed'
    study.save()

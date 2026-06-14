import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.patients.models import Patient
from apps.studies.models import Study
from apps.nodules.models import Nodule
from apps.reports.models import Report


def create_users():
    if User.objects.filter(username='admin').exists():
        print('用户已存在，跳过创建')
        return

    admin = User.objects.create_superuser(
        username='admin',
        password='admin123',
        name='系统管理员',
        role='expert',
        department='信息科',
        phone='13800000000',
        email='admin@hospital.com',
    )
    print(f'创建管理员: {admin.name}')

    doctors = [
        {
            'username': 'zhangwei',
            'password': 'doctor123',
            'name': '张伟',
            'role': 'expert',
            'department': '放射科',
            'phone': '13800000001',
            'email': 'zhangwei@hospital.com',
        },
        {
            'username': 'lina',
            'password': 'doctor123',
            'name': '李娜',
            'role': 'attending',
            'department': '放射科',
            'phone': '13800000002',
            'email': 'lina@hospital.com',
        },
        {
            'username': 'wangfang',
            'password': 'doctor123',
            'name': '王芳',
            'role': 'resident',
            'department': '呼吸内科',
            'phone': '13800000003',
            'email': 'wangfang@hospital.com',
        },
    ]

    for doc_data in doctors:
        doctor = User.objects.create_user(**doc_data)
        print(f'创建医生: {doctor.name} ({doctor.get_role_display()})')


def create_patients():
    if Patient.objects.exists():
        print('患者已存在，跳过创建')
        return []

    patients_data = [
        {
            'name': '刘建国',
            'gender': 'male',
            'birth_date': '1955-03-15',
            'id_number': '110101195503150011',
            'phone': '13900000001',
            'address': '北京市朝阳区建国路88号',
            'medical_record_number': 'MR20240001',
            'allergies': '青霉素过敏',
        },
        {
            'name': '陈秀英',
            'gender': 'female',
            'birth_date': '1962-07-22',
            'id_number': '310101196207220022',
            'phone': '13900000002',
            'address': '上海市浦东新区陆家嘴路100号',
            'medical_record_number': 'MR20240002',
            'allergies': '',
        },
        {
            'name': '赵志强',
            'gender': 'male',
            'birth_date': '1948-11-08',
            'id_number': '440101194811080033',
            'phone': '13900000003',
            'address': '广州市天河区体育西路50号',
            'medical_record_number': 'MR20240003',
            'allergies': '磺胺类药物过敏',
        },
        {
            'name': '孙丽华',
            'gender': 'female',
            'birth_date': '1970-05-30',
            'id_number': '510101197005300044',
            'phone': '13900000004',
            'address': '成都市武侯区人民南路20号',
            'medical_record_number': 'MR20240004',
            'allergies': '',
        },
        {
            'name': '周明德',
            'gender': 'male',
            'birth_date': '1960-01-12',
            'id_number': '330101196001120055',
            'phone': '13900000005',
            'address': '杭州市西湖区文三路300号',
            'medical_record_number': 'MR20240005',
            'allergies': '碘造影剂过敏',
        },
    ]

    patients = []
    for pdata in patients_data:
        patient = Patient.objects.create(**pdata)
        patients.append(patient)
        print(f'创建患者: {patient.name} ({patient.medical_record_number})')

    return patients


def create_studies(patients):
    if Study.objects.exists():
        print('检查已存在，跳过创建')
        return

    admin = User.objects.get(username='admin')
    studies_data = [
        {
            'patient': patients[0],
            'study_uid': 'STUDY20240101001',
            'study_date': '2024-01-15',
            'study_description': '胸部CT平扫',
            'modality': 'CT',
            'body_part': 'chest',
            'status': 'completed',
        },
        {
            'patient': patients[1],
            'study_uid': 'STUDY20240102002',
            'study_date': '2024-02-20',
            'study_description': '胸部CT增强扫描',
            'modality': 'CT',
            'body_part': 'chest',
            'status': 'completed',
        },
        {
            'patient': patients[2],
            'study_uid': 'STUDY20240103003',
            'study_date': '2024-03-10',
            'study_description': '胸部CT平扫',
            'modality': 'CT',
            'body_part': 'chest',
            'status': 'completed',
        },
        {
            'patient': patients[3],
            'study_uid': 'STUDY20240104004',
            'study_date': '2024-04-05',
            'study_description': '胸部高分辨率CT',
            'modality': 'CT',
            'body_part': 'chest',
            'status': 'analyzing',
        },
        {
            'patient': patients[4],
            'study_uid': 'STUDY20240105005',
            'study_date': '2024-05-18',
            'study_description': '胸部CT平扫+增强',
            'modality': 'CT',
            'body_part': 'chest',
            'status': 'pending',
        },
    ]

    for sdata in studies_data:
        study = Study.objects.create(uploaded_by=admin, **sdata)
        print(f'创建检查: {study.study_uid} - {study.study_description}')


def create_nodules():
    if Nodule.objects.exists():
        print('结节已存在，跳过创建')
        return

    studies = list(Study.objects.filter(status='completed'))
    if not studies:
        return

    nodules_data = [
        {
            'study': studies[0],
            'x': 120.5, 'y': 200.3, 'width': 18.2, 'height': 19.5,
            'diameter_mm': 12.5, 'volume_mm3': 1020.3,
            'nodule_type': 'solid', 'malignancy_score': 15, 'malignancy_level': 'benign',
            'density': 0.45, 'margin': 'smooth',
            'features': {'texture': 0.3, 'symmetry': 0.85},
            'detected_by': 'AI',
        },
        {
            'study': studies[0],
            'x': 300.0, 'y': 150.0, 'width': 25.0, 'height': 23.0,
            'diameter_mm': 18.0, 'volume_mm3': 3050.0,
            'nodule_type': 'ground_glass', 'malignancy_score': 55, 'malignancy_level': 'uncertain',
            'density': 0.25, 'margin': 'irregular',
            'features': {'texture': 0.5, 'symmetry': 0.7},
            'detected_by': 'AI',
        },
        {
            'study': studies[1],
            'x': 210.0, 'y': 280.0, 'width': 30.0, 'height': 28.0,
            'diameter_mm': 22.0, 'volume_mm3': 5570.0,
            'nodule_type': 'part_solid', 'malignancy_score': 72, 'malignancy_level': 'likely_malignant',
            'density': 0.55, 'margin': 'spiculated',
            'features': {'texture': 0.7, 'symmetry': 0.5},
            'detected_by': 'AI',
        },
        {
            'study': studies[2],
            'x': 180.0, 'y': 220.0, 'width': 12.0, 'height': 13.0,
            'diameter_mm': 8.5, 'volume_mm3': 320.0,
            'nodule_type': 'solid', 'malignancy_score': 10, 'malignancy_level': 'benign',
            'density': 0.6, 'margin': 'smooth',
            'features': {'texture': 0.2, 'symmetry': 0.9},
            'detected_by': 'AI',
        },
    ]

    for ndata in nodules_data:
        nodule = Nodule.objects.create(**ndata)
        print(f'创建结节: {nodule.study.study_uid} - {nodule.get_nodule_type_display()}')


def create_reports():
    if Report.objects.exists():
        print('报告已存在，跳过创建')
        return

    doctor = User.objects.filter(role='expert').first()
    if not doctor:
        doctor = User.objects.first()

    studies = list(Study.objects.filter(status='completed'))
    for study in studies[:3]:
        nodules = list(study.nodules.all())
        nodule_count = len(nodules)

        findings = f'患者{study.patient.name}，CT检查（胸部），'
        if nodule_count == 0:
            findings += '未发现明显结节。'
        else:
            findings += f'共发现{nodule_count}个结节：'
            for i, n in enumerate(nodules, 1):
                findings += f'结节{i}：{n.get_nodule_type_display()}，直径约{n.diameter_mm:.1f}mm，恶性评分{n.malignancy_score}分。'

        if nodule_count == 0:
            conclusion = '未见明显异常。'
            recommendation = '建议定期复查。'
        else:
            max_score = max(n.malignancy_score for n in nodules) if nodules else 0
            if max_score < 20:
                conclusion = f'发现{nodule_count}个结节，倾向良性。'
                recommendation = '建议6-12个月后复查CT。'
            elif max_score < 60:
                conclusion = f'发现{nodule_count}个结节，性质待定。'
                recommendation = '建议3-6个月后复查CT，密切观察。'
            else:
                conclusion = f'发现{nodule_count}个结节，建议进一步检查。'
                recommendation = '建议行增强CT或PET-CT进一步评估。'

        report = Report.objects.create(
            study=study,
            patient=study.patient,
            author=doctor,
            report_type='initial',
            findings=findings,
            conclusion=conclusion,
            recommendation=recommendation,
            nodules_summary={'total_count': nodule_count},
        )
        print(f'创建报告: {report.patient.name} - {report.get_report_type_display()}')


def main():
    print('=== 开始初始化数据 ===')
    create_users()
    patients = create_patients()
    create_studies(patients)
    create_nodules()
    create_reports()
    print('=== 数据初始化完成 ===')


if __name__ == '__main__':
    main()

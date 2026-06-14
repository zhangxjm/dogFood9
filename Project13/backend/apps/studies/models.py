from django.db import models
from django.conf import settings


class Study(models.Model):
    MODALITY_CHOICES = (
        ('CT', 'CT'),
        ('MRI', 'MRI'),
        ('X-Ray', 'X-Ray'),
    )
    BODY_PART_CHOICES = (
        ('chest', '胸部'),
        ('abdomen', '腹部'),
        ('head', '头部'),
    )
    STATUS_CHOICES = (
        ('pending', '待分析'),
        ('analyzing', '分析中'),
        ('completed', '已完成'),
    )

    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='studies', verbose_name='患者')
    study_uid = models.CharField('检查UID', max_length=100, unique=True)
    study_date = models.DateField('检查日期', null=True, blank=True)
    study_description = models.CharField('检查描述', max_length=255, blank=True, default='')
    modality = models.CharField('检查类型', max_length=10, choices=MODALITY_CHOICES, default='CT')
    body_part = models.CharField('检查部位', max_length=20, choices=BODY_PART_CHOICES, default='chest')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    dicom_file = models.FileField('DICOM文件', upload_to='dicom/', blank=True, null=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploaded_studies', verbose_name='上传者')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '影像检查'
        verbose_name_plural = '影像检查'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.study_uid} - {self.get_modality_display()}'


class StudyAnnotation(models.Model):
    ANNOTATION_TYPE_CHOICES = (
        ('annotation', '标注'),
        ('measurement', '测量'),
    )

    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='annotations', verbose_name='影像检查')
    annotator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='annotations', verbose_name='标注者')
    annotation_data = models.JSONField('标注数据', default=dict)
    annotation_type = models.CharField('标注类型', max_length=20, choices=ANNOTATION_TYPE_CHOICES, default='annotation')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '影像标注'
        verbose_name_plural = '影像标注'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.study.study_uid} - {self.get_annotation_type_display()}'

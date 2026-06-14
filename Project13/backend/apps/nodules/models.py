from django.db import models
from django.conf import settings


class Nodule(models.Model):
    NODULE_TYPE_CHOICES = (
        ('solid', '实性结节'),
        ('part_solid', '部分实性结节'),
        ('ground_glass', '磨玻璃结节'),
    )
    MALIGNANCY_LEVEL_CHOICES = (
        ('benign', '良性'),
        ('likely_benign', '可能良性'),
        ('uncertain', '不确定'),
        ('likely_malignant', '可能恶性'),
        ('malignant', '恶性'),
    )
    MARGIN_CHOICES = (
        ('smooth', 'smooth'),
        ('irregular', 'irregular'),
        ('spiculated', 'spiculated'),
    )
    DETECTED_BY_CHOICES = (
        ('AI', 'AI'),
        ('manual', '人工'),
    )

    study = models.ForeignKey('studies.Study', on_delete=models.CASCADE, related_name='nodules', verbose_name='影像检查')
    x = models.FloatField('X坐标')
    y = models.FloatField('Y坐标')
    width = models.FloatField('宽度')
    height = models.FloatField('高度')
    diameter_mm = models.FloatField('直径(mm)', null=True, blank=True)
    volume_mm3 = models.FloatField('体积(mm³)', null=True, blank=True)
    nodule_type = models.CharField('结节类型', max_length=20, choices=NODULE_TYPE_CHOICES, default='solid')
    malignancy_score = models.IntegerField('恶性评分', default=0)
    malignancy_level = models.CharField('恶性等级', max_length=20, choices=MALIGNANCY_LEVEL_CHOICES, default='benign')
    density = models.FloatField('密度', null=True, blank=True)
    margin = models.CharField('边缘特征', max_length=20, choices=MARGIN_CHOICES, default='smooth')
    features = models.JSONField('特征数据', default=dict)
    detected_by = models.CharField('检测方式', max_length=10, choices=DETECTED_BY_CHOICES, default='AI')
    detector = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='detected_nodules', verbose_name='检测者')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '结节'
        verbose_name_plural = '结节'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.study.study_uid} - {self.get_nodule_type_display()} ({self.get_malignancy_level_display()})'

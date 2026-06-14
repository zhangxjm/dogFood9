from django.db import models
from django.conf import settings


class Report(models.Model):
    REPORT_TYPE_CHOICES = (
        ('initial', '初诊报告'),
        ('follow_up', '复诊报告'),
        ('consultation', '会诊报告'),
    )

    study = models.ForeignKey('studies.Study', on_delete=models.CASCADE, related_name='reports', verbose_name='影像检查')
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='reports', verbose_name='患者')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='authored_reports', verbose_name='报告作者')
    report_type = models.CharField('报告类型', max_length=20, choices=REPORT_TYPE_CHOICES, default='initial')
    findings = models.TextField('检查所见', blank=True, default='')
    conclusion = models.TextField('诊断结论', blank=True, default='')
    recommendation = models.TextField('建议', blank=True, default='')
    nodules_summary = models.JSONField('结节摘要', default=dict)
    is_signed = models.BooleanField('是否签发', default=False)
    signed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='signed_reports', verbose_name='签发人')
    signed_at = models.DateTimeField('签发时间', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '诊断报告'
        verbose_name_plural = '诊断报告'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.patient.name} - {self.get_report_type_display()}'

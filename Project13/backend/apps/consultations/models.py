from django.db import models
from django.conf import settings


class Consultation(models.Model):
    STATUS_CHOICES = (
        ('pending', '待会诊'),
        ('in_progress', '会诊中'),
        ('completed', '已完成'),
    )

    study = models.ForeignKey('studies.Study', on_delete=models.CASCADE, related_name='consultations', verbose_name='影像检查')
    initiator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='initiated_consultations', verbose_name='发起人')
    experts = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='expert_consultations', verbose_name='会诊专家')
    title = models.CharField('会诊标题', max_length=255)
    description = models.TextField('会诊描述', blank=True, default='')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    result = models.TextField('会诊结论', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '专家会诊'
        verbose_name_plural = '专家会诊'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.get_status_display()})'


class ConsultationComment(models.Model):
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name='comments', verbose_name='会诊')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='consultation_comments', verbose_name='评论者')
    content = models.TextField('评论内容')
    attachments = models.JSONField('附件', default=list)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '会诊评论'
        verbose_name_plural = '会诊评论'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.author.name}: {self.content[:50]}'

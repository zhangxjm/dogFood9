from django.db import models


class MLModelRecord(models.Model):
    MODEL_TYPE_CHOICES = (
        ('detector', '检测模型'),
        ('classifier', '分类模型'),
    )

    name = models.CharField('模型名称', max_length=100)
    model_type = models.CharField('模型类型', max_length=20, choices=MODEL_TYPE_CHOICES)
    version = models.CharField('版本', max_length=50)
    description = models.TextField('描述', blank=True, default='')
    is_active = models.BooleanField('是否激活', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = 'ML模型记录'
        verbose_name_plural = 'ML模型记录'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} v{self.version}'

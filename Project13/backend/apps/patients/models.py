from django.db import models


class Patient(models.Model):
    GENDER_CHOICES = (
        ('male', '男'),
        ('female', '女'),
    )

    name = models.CharField('姓名', max_length=50)
    gender = models.CharField('性别', max_length=10, choices=GENDER_CHOICES)
    birth_date = models.DateField('出生日期', null=True, blank=True)
    id_number = models.CharField('身份证号', max_length=18, blank=True, default='')
    phone = models.CharField('电话', max_length=20, blank=True, default='')
    address = models.TextField('地址', blank=True, default='')
    medical_record_number = models.CharField('病历号', max_length=50, unique=True)
    allergies = models.TextField('过敏史', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '患者'
        verbose_name_plural = '患者'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.medical_record_number})'

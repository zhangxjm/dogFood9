from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('expert', '专家医生'),
        ('attending', '主治医生'),
        ('resident', '住院医生'),
        ('technician', '技师'),
    )

    name = models.CharField('姓名', max_length=50)
    role = models.CharField('角色', max_length=20, choices=ROLE_CHOICES, default='resident')
    department = models.CharField('科室', max_length=100, blank=True, default='')
    phone = models.CharField('电话', max_length=20, blank=True, default='')
    email = models.EmailField('邮箱', blank=True, default='')
    avatar = models.ImageField('头像', upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField('是否激活', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.get_role_display()})'

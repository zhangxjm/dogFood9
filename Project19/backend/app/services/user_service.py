from app.database import db
from app.models.models import User, UserSetting
import json


class UserService:
    @staticmethod
    def get_user(user_id=1):
        user = User.query.get(user_id)
        return user.to_dict() if user else None

    @staticmethod
    def get_all_users():
        users = User.query.all()
        return [u.to_dict() for u in users]

    @staticmethod
    def create_user(username, nickname='', voice_preference='female'):
        user = User(
            username=username,
            nickname=nickname or username,
            voice_preference=voice_preference
        )
        db.session.add(user)
        db.session.commit()
        return user.to_dict()

    @staticmethod
    def update_user(user_id, **kwargs):
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'message': '用户不存在'}

        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)

        db.session.commit()
        return {'success': True, 'user': user.to_dict()}

    @staticmethod
    def get_settings(user_id=1):
        settings = UserSetting.query.filter_by(user_id=user_id).all()
        result = {}
        for s in settings:
            result[s.setting_key] = {
                'value': s.setting_value,
                'description': s.description
            }
        return result

    @staticmethod
    def update_setting(user_id, setting_key, setting_value):
        setting = UserSetting.query.filter_by(
            user_id=user_id,
            setting_key=setting_key
        ).first()

        if not setting:
            setting = UserSetting(
                user_id=user_id,
                setting_key=setting_key,
                setting_value=str(setting_value)
            )
            db.session.add(setting)
        else:
            setting.setting_value = str(setting_value)

        db.session.commit()
        return {'success': True, 'setting': {setting_key: setting.setting_value}}

    @staticmethod
    def batch_update_settings(user_id, settings_dict):
        results = {}
        for key, value in settings_dict.items():
            result = UserService.update_setting(user_id, key, value)
            if result.get('success'):
                results.update(result['setting'])
        return {'success': True, 'settings': results}

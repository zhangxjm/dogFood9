from app.database import db
from app.models.models import Reminder
from datetime import datetime
from dateutil import parser as date_parser


class ReminderService:
    @staticmethod
    def get_reminders(user_id=1, is_active=None):
        query = Reminder.query.filter_by(user_id=user_id)
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        reminders = query.order_by(Reminder.remind_time.desc()).all()
        return [r.to_dict() for r in reminders]

    @staticmethod
    def get_reminder_by_id(reminder_id):
        reminder = Reminder.query.get(reminder_id)
        return reminder.to_dict() if reminder else None

    @staticmethod
    def create_reminder(user_id, title, remind_time_str, content='', repeat_type='none'):
        try:
            if isinstance(remind_time_str, str):
                remind_time = date_parser.parse(remind_time_str)
            else:
                remind_time = remind_time_str
        except:
            remind_time = datetime.now()

        reminder = Reminder(
            user_id=user_id,
            title=title,
            content=content,
            remind_time=remind_time,
            repeat_type=repeat_type,
            is_active=True
        )
        db.session.add(reminder)
        db.session.commit()
        return {'success': True, 'reminder': reminder.to_dict()}

    @staticmethod
    def update_reminder(reminder_id, **kwargs):
        reminder = Reminder.query.get(reminder_id)
        if not reminder:
            return {'success': False, 'message': '提醒不存在'}

        for key, value in kwargs.items():
            if hasattr(reminder, key):
                if key == 'remind_time' and isinstance(value, str):
                    try:
                        value = date_parser.parse(value)
                    except:
                        continue
                setattr(reminder, key, value)

        db.session.commit()
        return {'success': True, 'reminder': reminder.to_dict()}

    @staticmethod
    def delete_reminder(reminder_id):
        reminder = Reminder.query.get(reminder_id)
        if not reminder:
            return {'success': False, 'message': '提醒不存在'}

        db.session.delete(reminder)
        db.session.commit()
        return {'success': True}

    @staticmethod
    def toggle_reminder(reminder_id):
        reminder = Reminder.query.get(reminder_id)
        if not reminder:
            return {'success': False, 'message': '提醒不存在'}

        reminder.is_active = not reminder.is_active
        db.session.commit()
        return {'success': True, 'is_active': reminder.is_active}

from app.database import db
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    nickname = db.Column(db.String(120), default='用户')
    voice_preference = db.Column(db.String(50), default='female')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    settings = db.relationship('UserSetting', backref='user', lazy=True)
    reminders = db.relationship('Reminder', backref='user', lazy=True)
    conversations = db.relationship('Conversation', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'nickname': self.nickname,
            'voice_preference': self.voice_preference,
            'created_at': self.created_at.isoformat()
        }


class UserSetting(db.Model):
    __tablename__ = 'user_settings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    setting_key = db.Column(db.String(100), nullable=False)
    setting_value = db.Column(db.Text, default='')
    description = db.Column(db.String(255), default='')

    __table_args__ = (db.UniqueConstraint('user_id', 'setting_key', name='_user_setting_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'setting_key': self.setting_key,
            'setting_value': self.setting_value,
            'description': self.description
        }


class Device(db.Model):
    __tablename__ = 'devices'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    device_type = db.Column(db.String(50), nullable=False)
    room = db.Column(db.String(80), default='客厅')
    status = db.Column(db.String(50), default='off')
    ip_address = db.Column(db.String(50), default='')
    brightness = db.Column(db.Integer, default=100)
    temperature = db.Column(db.Float, default=25.0)
    volume = db.Column(db.Integer, default=50)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    scenes = db.relationship('SceneDevice', backref='device', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'device_type': self.device_type,
            'room': self.room,
            'status': self.status,
            'ip_address': self.ip_address,
            'brightness': self.brightness,
            'temperature': self.temperature,
            'volume': self.volume,
            'created_at': self.created_at.isoformat()
        }


class Scene(db.Model):
    __tablename__ = 'scenes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, default='')
    icon = db.Column(db.String(50), default='home')
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    devices = db.relationship('SceneDevice', backref='scene', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat(),
            'devices': [sd.to_dict() for sd in self.devices]
        }


class SceneDevice(db.Model):
    __tablename__ = 'scene_devices'

    id = db.Column(db.Integer, primary_key=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id'), nullable=False)
    device_id = db.Column(db.Integer, db.ForeignKey('devices.id'), nullable=False)
    target_status = db.Column(db.String(50), default='on')
    target_brightness = db.Column(db.Integer, default=100)
    target_temperature = db.Column(db.Float, default=25.0)

    def to_dict(self):
        device = Device.query.get(self.device_id)
        return {
            'id': self.id,
            'scene_id': self.scene_id,
            'device_id': self.device_id,
            'device_name': device.name if device else '',
            'device_type': device.device_type if device else '',
            'target_status': self.target_status,
            'target_brightness': self.target_brightness,
            'target_temperature': self.target_temperature
        }


class Reminder(db.Model):
    __tablename__ = 'reminders'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, default='')
    remind_time = db.Column(db.DateTime, nullable=False)
    repeat_type = db.Column(db.String(20), default='none')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'remind_time': self.remind_time.isoformat(),
            'repeat_type': self.repeat_type,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class Music(db.Model):
    __tablename__ = 'musics'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    artist = db.Column(db.String(255), default='未知歌手')
    album = db.Column(db.String(255), default='')
    duration = db.Column(db.Integer, default=0)
    url = db.Column(db.String(500), default='')
    is_favorite = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'artist': self.artist,
            'album': self.album,
            'duration': self.duration,
            'url': self.url,
            'is_favorite': self.is_favorite,
            'created_at': self.created_at.isoformat()
        }


class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.String(100), nullable=False)
    user_input = db.Column(db.Text, default='')
    bot_response = db.Column(db.Text, default='')
    intent = db.Column(db.String(100), default='')
    entities = db.Column(db.Text, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'user_input': self.user_input,
            'bot_response': self.bot_response,
            'intent': self.intent,
            'entities': json.loads(self.entities) if self.entities else {},
            'created_at': self.created_at.isoformat()
        }

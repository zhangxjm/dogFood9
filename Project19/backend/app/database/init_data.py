from app.database import db
from app.models.models import User, UserSetting, Device, Scene, SceneDevice, Music
from datetime import datetime, timedelta


def init_demo_data():
    if User.query.count() > 0:
        return

    user = User(username='admin', nickname='管理员', voice_preference='female')
    db.session.add(user)
    db.session.flush()

    default_settings = [
        {'setting_key': 'auto_respond', 'setting_value': 'true', 'description': '自动语音回复'},
        {'setting_key': 'wake_word', 'setting_value': '小助手', 'description': '唤醒词'},
        {'setting_key': 'theme_color', 'setting_value': '#2196F3', 'description': '主题颜色'},
        {'setting_key': 'language', 'setting_value': 'zh-CN', 'description': '界面语言'},
        {'setting_key': 'notification_sound', 'setting_value': 'true', 'description': '通知声音'},
        {'setting_key': 'default_room', 'setting_value': '客厅', 'description': '默认房间'}
    ]
    for s in default_settings:
        setting = UserSetting(user_id=user.id, **s)
        db.session.add(setting)

    devices = [
        {'name': '客厅主灯', 'device_type': 'light', 'room': '客厅', 'status': 'off', 'brightness': 100},
        {'name': '卧室灯', 'device_type': 'light', 'room': '卧室', 'status': 'off', 'brightness': 80},
        {'name': '书房灯', 'device_type': 'light', 'room': '书房', 'status': 'on', 'brightness': 100},
        {'name': '厨房灯', 'device_type': 'light', 'room': '厨房', 'status': 'off', 'brightness': 100},
        {'name': '客厅空调', 'device_type': 'ac', 'room': '客厅', 'status': 'off', 'temperature': 26.0},
        {'name': '卧室空调', 'device_type': 'ac', 'room': '卧室', 'status': 'off', 'temperature': 25.0},
        {'name': '客厅电视', 'device_type': 'tv', 'room': '客厅', 'status': 'off', 'volume': 50},
        {'name': '智能音箱', 'device_type': 'speaker', 'room': '客厅', 'status': 'on', 'volume': 60},
        {'name': '窗帘', 'device_type': 'curtain', 'room': '客厅', 'status': 'open'},
        {'name': '扫地机器人', 'device_type': 'robot', 'room': '全屋', 'status': 'standby'}
    ]
    device_objs = []
    for d in devices:
        dev = Device(**d)
        db.session.add(dev)
        device_objs.append(dev)
    db.session.flush()

    scenes = [
        {'name': '回家模式', 'description': '打开客厅灯光和空调', 'icon': 'home', 'is_default': True},
        {'name': '离家模式', 'description': '关闭所有电器', 'icon': 'exit_to_app', 'is_default': True},
        {'name': '睡眠模式', 'description': '关闭灯光，打开空调', 'icon': 'bedtime', 'is_default': True},
        {'name': '观影模式', 'description': '调暗灯光，打开电视', 'icon': 'movie', 'is_default': True},
        {'name': '阅读模式', 'description': '打开书房灯', 'icon': 'menu_book', 'is_default': True}
    ]
    scene_objs = []
    for s in scenes:
        sc = Scene(**s)
        db.session.add(sc)
        scene_objs.append(sc)
    db.session.flush()

    scene_configs = {
        '回家模式': [(0, 'on', 100), (4, 'on', 26.0)],
        '离家模式': [(0, 'off', 0), (1, 'off', 0), (2, 'off', 0), (3, 'off', 0), (4, 'off', 25.0), (5, 'off', 25.0), (6, 'off', 0)],
        '睡眠模式': [(0, 'off', 0), (1, 'off', 0), (2, 'off', 0), (5, 'on', 25.0)],
        '观影模式': [(0, 'on', 30), (6, 'on', 45)],
        '阅读模式': [(2, 'on', 100)]
    }
    for scene in scene_objs:
        if scene.name in scene_configs:
            for (dev_idx, status, value) in scene_configs[scene.name]:
                sd = SceneDevice(
                    scene_id=scene.id,
                    device_id=device_objs[dev_idx].id,
                    target_status=status,
                    target_brightness=value if isinstance(value, int) else 100,
                    target_temperature=float(value) if isinstance(value, (int, float)) else 25.0
                )
                db.session.add(sd)

    musics = [
        {'title': '夜曲', 'artist': '周杰伦', 'album': '十一月的肖邦', 'duration': 234, 'url': 'https://example.com/music1.mp3', 'is_favorite': True},
        {'title': '稻香', 'artist': '周杰伦', 'album': '魔杰座', 'duration': 223, 'url': 'https://example.com/music2.mp3', 'is_favorite': True},
        {'title': '晴天', 'artist': '周杰伦', 'album': '叶惠美', 'duration': 269, 'url': 'https://example.com/music3.mp3', 'is_favorite': False},
        {'title': '青花瓷', 'artist': '周杰伦', 'album': '我很忙', 'duration': 239, 'url': 'https://example.com/music4.mp3', 'is_favorite': True},
        {'title': '七里香', 'artist': '周杰伦', 'album': '七里香', 'duration': 299, 'url': 'https://example.com/music5.mp3', 'is_favorite': False}
    ]
    for m in musics:
        music = Music(**m)
        db.session.add(music)

    db.session.commit()

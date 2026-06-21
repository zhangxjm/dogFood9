from app.database import db
from app.models.models import Device, Scene, SceneDevice


class DeviceService:
    @staticmethod
    def get_all_devices():
        devices = Device.query.all()
        return [d.to_dict() for d in devices]

    @staticmethod
    def get_device_by_id(device_id):
        device = Device.query.get(device_id)
        return device.to_dict() if device else None

    @staticmethod
    def get_devices_by_room(room):
        devices = Device.query.filter_by(room=room).all()
        return [d.to_dict() for d in devices]

    @staticmethod
    def get_devices_by_type(device_type):
        devices = Device.query.filter_by(device_type=device_type).all()
        return [d.to_dict() for d in devices]

    @staticmethod
    def control_device(device_id, action, **params):
        device = Device.query.get(device_id)
        if not device:
            return {'success': False, 'message': '设备不存在'}

        if action == 'turn_on':
            device.status = 'on'
        elif action == 'turn_off':
            device.status = 'off'
        elif action == 'increase':
            if device.device_type == 'light':
                device.brightness = min(device.brightness + 20, 100)
            elif device.device_type == 'speaker' or device.device_type == 'tv':
                device.volume = min(device.volume + 10, 100)
            elif device.device_type == 'ac':
                device.temperature = min(device.temperature + 1, 35)
        elif action == 'decrease':
            if device.device_type == 'light':
                device.brightness = max(device.brightness - 20, 0)
            elif device.device_type == 'speaker' or device.device_type == 'tv':
                device.volume = max(device.volume - 10, 0)
            elif device.device_type == 'ac':
                device.temperature = max(device.temperature - 1, 16)
        elif action == 'set':
            if 'brightness' in params:
                device.brightness = max(0, min(100, int(params['brightness'])))
            if 'volume' in params:
                device.volume = max(0, min(100, int(params['volume'])))
            if 'temperature' in params:
                device.temperature = max(16, min(35, float(params['temperature'])))

        db.session.commit()
        return {'success': True, 'device': device.to_dict()}

    @staticmethod
    def control_by_type_and_room(device_type, room, action, **params):
        query = Device.query
        if device_type:
            query = query.filter_by(device_type=device_type)
        if room:
            query = query.filter_by(room=room)

        devices = query.all()
        if not devices:
            return {'success': False, 'message': '未找到匹配的设备'}

        results = []
        for device in devices:
            result = DeviceService.control_device(device.id, action, **params)
            results.append(result)

        return {
            'success': True,
            'message': f'已控制 {len(devices)} 个设备',
            'devices': [r.get('device') for r in results if r.get('success')]
        }

    @staticmethod
    def add_device(name, device_type, room='客厅', **kwargs):
        device = Device(
            name=name,
            device_type=device_type,
            room=room,
            status=kwargs.get('status', 'off'),
            brightness=kwargs.get('brightness', 100),
            temperature=kwargs.get('temperature', 25.0),
            volume=kwargs.get('volume', 50)
        )
        db.session.add(device)
        db.session.commit()
        return device.to_dict()

    @staticmethod
    def delete_device(device_id):
        device = Device.query.get(device_id)
        if device:
            db.session.delete(device)
            db.session.commit()
            return {'success': True}
        return {'success': False, 'message': '设备不存在'}

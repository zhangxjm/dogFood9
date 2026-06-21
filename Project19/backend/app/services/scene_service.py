from app.database import db
from app.models.models import Scene, SceneDevice, Device
from app.services.device_service import DeviceService


class SceneService:
    @staticmethod
    def get_all_scenes():
        scenes = Scene.query.all()
        return [s.to_dict() for s in scenes]

    @staticmethod
    def get_scene_by_id(scene_id):
        scene = Scene.query.get(scene_id)
        return scene.to_dict() if scene else None

    @staticmethod
    def create_scene(name, description='', icon='home'):
        scene = Scene(name=name, description=description, icon=icon)
        db.session.add(scene)
        db.session.commit()
        return scene.to_dict()

    @staticmethod
    def activate_scene(scene_id):
        scene = Scene.query.get(scene_id)
        if not scene:
            return {'success': False, 'message': '场景不存在'}

        results = []
        for sd in scene.devices:
            params = {}
            if sd.target_status == 'on' or sd.target_status == 'open':
                action = 'turn_on'
            else:
                action = 'turn_off'

            if sd.target_brightness and sd.target_brightness != 100:
                params['brightness'] = sd.target_brightness
            if sd.target_temperature and abs(sd.target_temperature - 25.0) > 0.01:
                params['temperature'] = sd.target_temperature

            result = DeviceService.control_device(sd.device_id, action, **params)
            results.append(result)

        return {
            'success': True,
            'scene': scene.name,
            'message': f'已激活场景: {scene.name}',
            'devices_affected': len(results)
        }

    @staticmethod
    def activate_scene_by_name(scene_name):
        scene = Scene.query.filter_by(name=scene_name).first()
        if not scene:
            return {'success': False, 'message': f'场景 {scene_name} 不存在'}
        return SceneService.activate_scene(scene.id)

    @staticmethod
    def update_scene(scene_id, **kwargs):
        scene = Scene.query.get(scene_id)
        if not scene:
            return {'success': False, 'message': '场景不存在'}

        for key, value in kwargs.items():
            if hasattr(scene, key):
                setattr(scene, key, value)

        db.session.commit()
        return {'success': True, 'scene': scene.to_dict()}

    @staticmethod
    def delete_scene(scene_id):
        scene = Scene.query.get(scene_id)
        if not scene:
            return {'success': False, 'message': '场景不存在'}

        if scene.is_default:
            return {'success': False, 'message': '默认场景不可删除'}

        SceneDevice.query.filter_by(scene_id=scene_id).delete()
        db.session.delete(scene)
        db.session.commit()
        return {'success': True}

    @staticmethod
    def add_device_to_scene(scene_id, device_id, target_status='on', **kwargs):
        scene = Scene.query.get(scene_id)
        device = Device.query.get(device_id)
        if not scene or not device:
            return {'success': False, 'message': '场景或设备不存在'}

        sd = SceneDevice(
            scene_id=scene_id,
            device_id=device_id,
            target_status=target_status,
            target_brightness=kwargs.get('target_brightness', 100),
            target_temperature=kwargs.get('target_temperature', 25.0)
        )
        db.session.add(sd)
        db.session.commit()
        return {'success': True, 'scene_device': sd.to_dict()}

    @staticmethod
    def remove_device_from_scene(scene_device_id):
        sd = SceneDevice.query.get(scene_device_id)
        if not sd:
            return {'success': False, 'message': '不存在'}
        db.session.delete(sd)
        db.session.commit()
        return {'success': True}

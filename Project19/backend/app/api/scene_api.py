from flask import jsonify, request, Blueprint
from app.services import SceneService

scene_bp = Blueprint('scene', __name__, url_prefix='/api/scenes')


@scene_bp.route('/', methods=['GET'])
def get_all():
    scenes = SceneService.get_all_scenes()
    return jsonify({'success': True, 'scenes': scenes})


@scene_bp.route('/<int:scene_id>', methods=['GET'])
def get_one(scene_id):
    scene = SceneService.get_scene_by_id(scene_id)
    if not scene:
        return jsonify({'success': False, 'message': '场景不存在'}), 404
    return jsonify({'success': True, 'scene': scene})


@scene_bp.route('/', methods=['POST'])
def create():
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'success': False, 'message': '场景名称必填'}), 400

    scene = SceneService.create_scene(
        name=name,
        description=data.get('description', ''),
        icon=data.get('icon', 'home')
    )
    return jsonify({'success': True, 'scene': scene}), 201


@scene_bp.route('/<int:scene_id>/activate', methods=['POST'])
def activate(scene_id):
    result = SceneService.activate_scene(scene_id)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@scene_bp.route('/activate', methods=['POST'])
def activate_by_name():
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'success': False, 'message': '场景名称必填'}), 400
    result = SceneService.activate_scene_by_name(name)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@scene_bp.route('/<int:scene_id>', methods=['PUT'])
def update(scene_id):
    data = request.get_json() or {}
    result = SceneService.update_scene(scene_id, **data)
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code


@scene_bp.route('/<int:scene_id>', methods=['DELETE'])
def delete(scene_id):
    result = SceneService.delete_scene(scene_id)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@scene_bp.route('/<int:scene_id>/devices', methods=['POST'])
def add_device(scene_id):
    data = request.get_json() or {}
    device_id = data.get('device_id')
    target_status = data.get('target_status', 'on')

    if not device_id:
        return jsonify({'success': False, 'message': '设备ID必填'}), 400

    result = SceneService.add_device_to_scene(
        scene_id,
        device_id,
        target_status,
        target_brightness=data.get('target_brightness', 100),
        target_temperature=data.get('target_temperature', 25.0)
    )
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@scene_bp.route('/devices/<int:scene_device_id>', methods=['DELETE'])
def remove_device(scene_device_id):
    result = SceneService.remove_device_from_scene(scene_device_id)
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code

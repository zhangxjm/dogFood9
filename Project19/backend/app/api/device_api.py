from flask import jsonify, request, Blueprint
from app.services import DeviceService

device_bp = Blueprint('device', __name__, url_prefix='/api/devices')


@device_bp.route('/', methods=['GET'])
def get_all():
    room = request.args.get('room')
    device_type = request.args.get('type')

    if room:
        devices = DeviceService.get_devices_by_room(room)
    elif device_type:
        devices = DeviceService.get_devices_by_type(device_type)
    else:
        devices = DeviceService.get_all_devices()

    return jsonify({'success': True, 'devices': devices})


@device_bp.route('/<int:device_id>', methods=['GET'])
def get_one(device_id):
    device = DeviceService.get_device_by_id(device_id)
    if not device:
        return jsonify({'success': False, 'message': '设备不存在'}), 404
    return jsonify({'success': True, 'device': device})


@device_bp.route('/<int:device_id>/control', methods=['POST'])
def control(device_id):
    data = request.get_json() or {}
    action = data.get('action', 'turn_on')
    params = {k: v for k, v in data.items() if k != 'action'}

    result = DeviceService.control_device(device_id, action, **params)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@device_bp.route('/control', methods=['POST'])
def control_batch():
    data = request.get_json() or {}
    device_type = data.get('device_type')
    room = data.get('room')
    action = data.get('action', 'turn_on')
    params = {k: v for k, v in data.items() if k not in ['device_type', 'room', 'action']}

    result = DeviceService.control_by_type_and_room(device_type, room, action, **params)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@device_bp.route('/', methods=['POST'])
def create():
    data = request.get_json() or {}
    name = data.get('name')
    device_type = data.get('device_type')

    if not name or not device_type:
        return jsonify({'success': False, 'message': '名称和类型必填'}), 400

    device = DeviceService.add_device(
        name=name,
        device_type=device_type,
        room=data.get('room', '客厅'),
        **{k: v for k, v in data.items() if k not in ['name', 'device_type', 'room']}
    )
    return jsonify({'success': True, 'device': device}), 201


@device_bp.route('/<int:device_id>', methods=['DELETE'])
def delete(device_id):
    result = DeviceService.delete_device(device_id)
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code

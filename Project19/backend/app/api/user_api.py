from flask import jsonify, request, Blueprint
from app.services import UserService

user_bp = Blueprint('user', __name__, url_prefix='/api/users')


@user_bp.route('/', methods=['GET'])
def get_all():
    users = UserService.get_all_users()
    return jsonify({'success': True, 'users': users})


@user_bp.route('/<int:user_id>', methods=['GET'])
def get_one(user_id):
    user = UserService.get_user(user_id)
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    return jsonify({'success': True, 'user': user})


@user_bp.route('/', methods=['POST'])
def create():
    data = request.get_json() or {}
    username = data.get('username')
    if not username:
        return jsonify({'success': False, 'message': '用户名必填'}), 400

    user = UserService.create_user(
        username=username,
        nickname=data.get('nickname', ''),
        voice_preference=data.get('voice_preference', 'female')
    )
    return jsonify({'success': True, 'user': user}), 201


@user_bp.route('/<int:user_id>', methods=['PUT'])
def update(user_id):
    data = request.get_json() or {}
    result = UserService.update_user(user_id, **data)
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code


@user_bp.route('/<int:user_id>/settings', methods=['GET'])
def get_settings(user_id):
    settings = UserService.get_settings(user_id)
    return jsonify({'success': True, 'settings': settings})


@user_bp.route('/<int:user_id>/settings', methods=['PUT'])
def update_settings(user_id):
    data = request.get_json() or {}
    setting_key = data.get('key')
    setting_value = data.get('value')

    if setting_key and setting_value is not None:
        result = UserService.update_setting(user_id, setting_key, setting_value)
    else:
        settings_dict = {k: v for k, v in data.items() if k not in ['key', 'value']}
        result = UserService.batch_update_settings(user_id, settings_dict)

    return jsonify(result)

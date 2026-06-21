from flask import jsonify, request, Blueprint
from app.services import ReminderService

reminder_bp = Blueprint('reminder', __name__, url_prefix='/api/reminders')


@reminder_bp.route('/', methods=['GET'])
def get_all():
    user_id = int(request.args.get('user_id', 1))
    is_active = request.args.get('is_active')
    if is_active is not None:
        is_active = is_active.lower() == 'true'
    reminders = ReminderService.get_reminders(user_id, is_active)
    return jsonify({'success': True, 'reminders': reminders})


@reminder_bp.route('/<int:reminder_id>', methods=['GET'])
def get_one(reminder_id):
    reminder = ReminderService.get_reminder_by_id(reminder_id)
    if not reminder:
        return jsonify({'success': False, 'message': '提醒不存在'}), 404
    return jsonify({'success': True, 'reminder': reminder})


@reminder_bp.route('/', methods=['POST'])
def create():
    data = request.get_json() or {}
    user_id = int(data.get('user_id', 1))
    title = data.get('title', '提醒事项')
    remind_time = data.get('remind_time')
    content = data.get('content', '')
    repeat_type = data.get('repeat_type', 'none')

    if not remind_time:
        return jsonify({'success': False, 'message': '提醒时间必填'}), 400

    result = ReminderService.create_reminder(user_id, title, remind_time, content, repeat_type)
    status_code = 201 if result.get('success') else 400
    return jsonify(result), status_code


@reminder_bp.route('/<int:reminder_id>', methods=['PUT'])
def update(reminder_id):
    data = request.get_json() or {}
    result = ReminderService.update_reminder(reminder_id, **data)
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code


@reminder_bp.route('/<int:reminder_id>', methods=['DELETE'])
def delete(reminder_id):
    result = ReminderService.delete_reminder(reminder_id)
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code


@reminder_bp.route('/<int:reminder_id>/toggle', methods=['POST'])
def toggle(reminder_id):
    result = ReminderService.toggle_reminder(reminder_id)
    status_code = 200 if result.get('success') else 404
    return jsonify(result), status_code

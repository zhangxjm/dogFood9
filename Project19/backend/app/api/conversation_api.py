from flask import jsonify, request, Blueprint
from app.services import ConversationService

conversation_bp = Blueprint('conversation', __name__, url_prefix='/api/chat')


@conversation_bp.route('/text', methods=['POST'])
def chat_text():
    data = request.get_json() or {}
    user_id = int(data.get('user_id', 1))
    text = data.get('text', '')
    session_id = data.get('session_id')

    if not text:
        return jsonify({'success': False, 'message': '请输入文本'}), 400

    result = ConversationService.process_text(user_id, text, session_id)
    return jsonify(result)


@conversation_bp.route('/voice', methods=['POST'])
def chat_voice():
    user_id = int(request.form.get('user_id', 1))
    session_id = request.form.get('session_id')

    if 'audio' not in request.files:
        return jsonify({'success': False, 'message': '请上传音频文件'}), 400

    audio_file = request.files['audio']
    audio_data = audio_file.read()

    result = ConversationService.process_voice(user_id, audio_data, session_id)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@conversation_bp.route('/history', methods=['GET'])
def get_history():
    user_id = int(request.args.get('user_id', 1))
    limit = int(request.args.get('limit', 20))
    history = ConversationService.get_history(user_id, limit)
    return jsonify({'success': True, 'history': history})


@conversation_bp.route('/history', methods=['DELETE'])
def clear_history():
    user_id = int(request.args.get('user_id', 1))
    result = ConversationService.clear_history(user_id)
    return jsonify(result)


@conversation_bp.route('/nlu/parse', methods=['POST'])
def nlu_parse():
    from app.nlu import nlu_service
    data = request.get_json() or {}
    text = data.get('text', '')
    if not text:
        return jsonify({'success': False, 'message': '请输入文本'}), 400
    result = nlu_service.parse(text)
    return jsonify({'success': True, 'result': result})

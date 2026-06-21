from flask import jsonify
from app.api.device_api import device_bp
from app.api.weather_api import weather_bp
from app.api.reminder_api import reminder_bp
from app.api.music_api import music_bp
from app.api.scene_api import scene_bp
from app.api.user_api import user_bp
from app.api.conversation_api import conversation_bp


def register_routes(app):
    app.register_blueprint(device_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(reminder_bp)
    app.register_blueprint(music_bp)
    app.register_blueprint(scene_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(conversation_bp)

    @app.route('/')
    def index():
        return jsonify({
            'name': '智能家居语音控制系统 API',
            'version': '1.0.0',
            'endpoints': {
                '设备管理': '/api/devices',
                '天气查询': '/api/weather',
                '提醒管理': '/api/reminders',
                '音乐播放': '/api/music',
                '场景管理': '/api/scenes',
                '用户管理': '/api/users',
                '语音对话': '/api/chat'
            }
        })

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'message': '服务运行正常'})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': '接口不存在'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'success': False, 'message': '服务器内部错误'}), 500

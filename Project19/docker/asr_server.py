from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

SAMPLE_TEXTS = [
    '打开客厅的灯',
    '今天天气怎么样',
    '设置一个明天早上8点的闹钟',
    '播放周杰伦的音乐',
    '开启回家模式',
    '关掉卧室的空调',
    '明天北京天气如何',
    '提醒我下午3点开会',
    '音量调大一点',
    '现在几点了',
    '关闭所有灯光',
    '播放音乐',
    '切换到睡眠模式'
]


@app.route('/asr', methods=['POST'])
def asr_recognize():
    if 'audio' not in request.files:
        return jsonify({'success': False, 'error': 'No audio file'}), 400

    text = random.choice(SAMPLE_TEXTS)
    confidence = round(random.uniform(0.85, 0.98), 2)

    return jsonify({
        'success': True,
        'text': text,
        'confidence': confidence
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'ASR Service'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001, debug=False, use_reloader=False)

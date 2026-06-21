from flask import Flask, request, jsonify
from flask_cors import CORS
import jieba
import re
import random
from datetime import datetime, timedelta
import json

app = Flask(__name__)
CORS(app)
jieba.setLogLevel(jieba.logging.WARNING)

INTENTS = {
    'device_control': ['打开', '关闭', '开启', '关掉', '启动', '停止', '调节', '调高', '调低', '设置'],
    'weather_query': ['天气', '气温', '温度', '下雨', '晴天', '阴天', '刮风', '下雪'],
    'reminder_set': ['提醒', '闹钟', '叫我', '提醒我', '设置提醒', '定时'],
    'music_play': ['播放', '音乐', '歌曲', '来一首', '放歌', '唱首歌'],
    'music_control': ['暂停', '继续', '下一首', '上一首', '音量', '静音'],
    'scene_control': ['模式', '场景', '回家', '离家', '睡觉', '睡眠', '观影', '阅读'],
    'time_query': ['几点', '时间', '日期', '今天', '明天', '星期'],
    'greeting': ['你好', '您好', '嗨', '哈喽', '早上好', '下午好', '晚上好'],
    'thanks': ['谢谢', '感谢', '多谢'],
    'unknown': []
}


@app.route('/nlu', methods=['POST'])
def nlu_parse():
    data = request.get_json() or {}
    text = data.get('text', '').strip()

    if not text:
        return jsonify({
            'success': False,
            'error': 'No text provided'
        }), 400

    words = list(jieba.cut(text))
    intent = _classify_intent(text)
    entities = _extract_entities(text)
    slots = _fill_slots(intent, entities, text)

    return jsonify({
        'success': True,
        'intent': intent,
        'entities': entities,
        'slots': slots,
        'text': text,
        'confidence': round(random.uniform(0.8, 0.95), 2)
    })


def _classify_intent(text):
    scores = {}
    for intent, keywords in INTENTS.items():
        score = 0
        for kw in keywords:
            if kw in text:
                score += len(kw) * 2
        if score > 0:
            scores[intent] = score
    return max(scores, key=scores.get) if scores else 'unknown'


def _extract_entities(text):
    entities = {}

    for room in ['客厅', '卧室', '书房', '厨房', '餐厅', '卫生间', '阳台', '全屋']:
        if room in text:
            entities['room'] = room
            break

    device_keywords = {
        'light': ['灯', '灯光'],
        'ac': ['空调'],
        'tv': ['电视'],
        'speaker': ['音箱', '音响'],
        'curtain': ['窗帘'],
        'robot': ['扫地机器人', '机器人']
    }
    for dtype, keywords in device_keywords.items():
        for kw in keywords:
            if kw in text:
                entities['device_type'] = dtype
                break

    if any(w in text for w in ['打开', '开启', '启动']):
        entities['action'] = 'turn_on'
    elif any(w in text for w in ['关闭', '关掉', '停止']):
        entities['action'] = 'turn_off'

    for city in ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '武汉', '西安']:
        if city in text:
            entities['city'] = city
            break

    time_match = re.search(r'(\d{1,2})\s*[点:：](\d{0,2})', text)
    if time_match:
        hour = int(time_match.group(1))
        if any(w in text for w in ['下午', '晚上']) and hour < 12:
            hour += 12
        minute = int(time_match.group(2)) if time_match.group(2) else 0
        now = datetime.now()
        target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if '明天' in text:
            target += timedelta(days=1)
        entities['datetime'] = target.isoformat()

    return entities


def _fill_slots(intent, entities, text):
    slots = {}
    if intent == 'device_control':
        slots['device_type'] = entities.get('device_type', 'light')
        slots['room'] = entities.get('room', '客厅')
        slots['action'] = entities.get('action', 'turn_on')
    elif intent == 'weather_query':
        slots['city'] = entities.get('city', '北京')
    elif intent == 'reminder_set':
        slots['datetime'] = entities.get('datetime', (datetime.now() + timedelta(hours=1)).isoformat())
    return slots


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'NLU Service'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8002, debug=False, use_reloader=False)

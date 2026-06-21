import re
import jieba
from datetime import datetime, timedelta
import json


class NLUService:
    INTENTS = {
        'device_control': ['打开', '关闭', '开启', '关掉', '启动', '停止', '调节', '调高', '调低', '设置'],
        'weather_query': ['天气', '气温', '温度', '下雨', '晴天', '阴天', '刮风', '下雪', '雾霾'],
        'reminder_set': ['提醒', '闹钟', '叫我', '提醒我', '设置提醒', '定时'],
        'music_play': ['播放', '音乐', '歌曲', '来一首', '放歌', '唱首歌'],
        'music_control': ['暂停', '继续', '下一首', '上一首', '音量', '静音', '停止播放'],
        'scene_control': ['模式', '场景', '回家', '离家', '睡觉', '睡眠', '观影', '阅读'],
        'time_query': ['几点', '时间', '日期', '今天', '明天', '星期'],
        'greeting': ['你好', '您好', '嗨', '哈喽', '早上好', '下午好', '晚上好'],
        'thanks': ['谢谢', '感谢', '多谢', '谢谢你'],
        'unknown': []
    }

    DEVICE_TYPES = {
        'light': ['灯', '灯光', '电灯'],
        'ac': ['空调', '冷气', '暖气'],
        'tv': ['电视', '电视机'],
        'speaker': ['音箱', '音响'],
        'curtain': ['窗帘', '帘子'],
        'robot': ['扫地机器人', '机器人', '扫地机'],
        'fan': ['风扇', '电扇']
    }

    ROOMS = ['客厅', '卧室', '书房', '厨房', '餐厅', '卫生间', '阳台', '全屋']

    SCENES = {
        '回家模式': ['回家', '回来了', '我回来了'],
        '离家模式': ['离家', '出门', '走了', '我走了'],
        '睡眠模式': ['睡觉', '睡眠', '休息', '晚安'],
        '观影模式': ['观影', '看电影', '看电视'],
        '阅读模式': ['阅读', '看书', '读书', '学习']
    }

    def __init__(self):
        jieba.setLogLevel(jieba.logging.WARNING)

    def parse(self, text):
        if not text or not text.strip():
            return self._empty_result()

        text = text.strip()
        words = list(jieba.cut(text))

        intent = self._classify_intent(text, words)
        entities = self._extract_entities(text, words, intent)
        slots = self._fill_slots(intent, entities, text)

        return {
            'intent': intent,
            'entities': entities,
            'slots': slots,
            'text': text,
            'confidence': self._calculate_confidence(intent, entities, text)
        }

    def _classify_intent(self, text, words):
        scores = {}

        for intent, keywords in self.INTENTS.items():
            score = 0
            for kw in keywords:
                if kw in text:
                    score += len(kw) * 2
                if kw in words:
                    score += len(kw)
            if score > 0:
                scores[intent] = score

        if not scores:
            return 'unknown'

        if 'scene_control' in scores:
            for scene_name, trigger_words in self.SCENES.items():
                for tw in trigger_words:
                    if tw in text and '模式' in text:
                        return 'scene_control'
                    if tw in text:
                        scores['scene_control'] = scores.get('scene_control', 0) + 3

        return max(scores, key=scores.get)

    def _extract_entities(self, text, words, intent):
        entities = {}

        device_type = self._extract_device_type(text)
        if device_type:
            entities['device_type'] = device_type

        room = self._extract_room(text)
        if room:
            entities['room'] = room

        action = self._extract_action(text)
        if action:
            entities['action'] = action

        scene = self._extract_scene(text)
        if scene:
            entities['scene'] = scene

        city = self._extract_city(text)
        if city:
            entities['city'] = city

        time_info = self._extract_time(text)
        if time_info:
            entities.update(time_info)

        music_info = self._extract_music_info(text)
        if music_info:
            entities.update(music_info)

        value = self._extract_value(text)
        if value is not None:
            entities['value'] = value

        reminder_content = self._extract_reminder_content(text)
        if reminder_content:
            entities['reminder_content'] = reminder_content

        return entities

    def _extract_device_type(self, text):
        for dtype, keywords in self.DEVICE_TYPES.items():
            for kw in keywords:
                if kw in text:
                    return dtype
        return None

    def _extract_room(self, text):
        for room in self.ROOMS:
            if room in text:
                return room
        return None

    def _extract_action(self, text):
        if any(w in text for w in ['打开', '开启', '启动']):
            return 'turn_on'
        if any(w in text for w in ['关闭', '关掉', '停止']):
            return 'turn_off'
        if any(w in text for w in ['调高', '调大', '增加']):
            return 'increase'
        if any(w in text for w in ['调低', '调小', '减少']):
            return 'decrease'
        if any(w in text for w in ['设置', '调节', '调到']):
            return 'set'
        return None

    def _extract_scene(self, text):
        for scene_name, trigger_words in self.SCENES.items():
            if scene_name in text:
                return scene_name
            for tw in trigger_words:
                if tw in text:
                    return scene_name
        return None

    def _extract_city(self, text):
        cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '武汉', '西安',
                  '天津', '苏州', '长沙', '郑州', '青岛', '大连', '厦门', '福州', '济南', '合肥']
        for city in cities:
            if city in text:
                return city
        return None

    def _extract_time(self, text):
        result = {}

        date_ref = None
        if '今天' in text:
            date_ref = datetime.now()
        elif '明天' in text:
            date_ref = datetime.now() + timedelta(days=1)
        elif '后天' in text:
            date_ref = datetime.now() + timedelta(days=2)
        elif '大后天' in text:
            date_ref = datetime.now() + timedelta(days=3)

        time_match = re.search(r'(\d{1,2})\s*[点:：](\d{0,2})', text)
        hour = None
        minute = 0

        if time_match:
            hour = int(time_match.group(1))
            if time_match.group(2):
                minute = int(time_match.group(2))

            if any(w in text for w in ['下午', '晚上']):
                if hour < 12:
                    hour += 12
        elif any(w in text for w in ['早上', '早晨']):
            hour = 8
        elif any(w in text for w in ['中午', '午间']):
            hour = 12
        elif any(w in text for w in ['晚上', '傍晚']):
            hour = 20
        elif any(w in text for w in ['凌晨', '半夜']):
            hour = 0

        if date_ref or hour is not None:
            target_dt = date_ref if date_ref else datetime.now()
            if hour is not None:
                target_dt = target_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
            result['datetime'] = target_dt.isoformat()
            result['date'] = target_dt.strftime('%Y-%m-%d')
            result['time'] = target_dt.strftime('%H:%M:%S')

        return result if result else None

    def _extract_music_info(self, text):
        result = {}

        artists = ['周杰伦', '林俊杰', '薛之谦', '李荣浩', '毛不易', '邓紫棋', '陈奕迅', '刘德华', '张学友', '王菲']
        for artist in artists:
            if artist in text:
                result['artist'] = artist
                break

        song_match = re.search(r'[《]([^》]+)[》]', text)
        if song_match:
            result['song'] = song_match.group(1)

        return result if result else None

    def _extract_value(self, text):
        num_match = re.search(r'(\d+(?:\.\d+)?)\s*度?', text)
        if num_match and '天气' not in text:
            try:
                val = float(num_match.group(1))
                if val.is_integer():
                    return int(val)
                return val
            except:
                pass
        return None

    def _extract_reminder_content(self, text):
        patterns = [
            r'提醒我(.+?)(?:[，。,.!！]|$)',
            r'叫我(.+?)(?:[，。,.!！]|$)',
            r'提醒(.+?)(?:[，。,.!！]|$)'
        ]
        for p in patterns:
            match = re.search(p, text)
            if match:
                content = match.group(1).strip()
                if content and len(content) > 0:
                    return content
        return None

    def _fill_slots(self, intent, entities, text):
        slots = {}

        if intent == 'device_control':
            slots['device_type'] = entities.get('device_type', 'light')
            slots['room'] = entities.get('room', '客厅')
            slots['action'] = entities.get('action', 'turn_on')
            slots['value'] = entities.get('value')

        elif intent == 'weather_query':
            slots['city'] = entities.get('city', '北京')
            slots['date'] = entities.get('date', datetime.now().strftime('%Y-%m-%d'))

        elif intent == 'reminder_set':
            slots['title'] = entities.get('reminder_content', '提醒事项')
            slots['datetime'] = entities.get('datetime', (datetime.now() + timedelta(hours=1)).isoformat())
            slots['repeat_type'] = 'none'

        elif intent == 'music_play':
            slots['artist'] = entities.get('artist')
            slots['song'] = entities.get('song')
            slots['action'] = 'play'

        elif intent == 'music_control':
            if any(w in text for w in ['暂停', '停']):
                slots['action'] = 'pause'
            elif any(w in text for w in ['继续']):
                slots['action'] = 'resume'
            elif any(w in text for w in ['下一首']):
                slots['action'] = 'next'
            elif any(w in text for w in ['上一首']):
                slots['action'] = 'prev'
            elif any(w in text for w in ['音量', '声音']):
                slots['action'] = 'volume'
                slots['value'] = entities.get('value')
            elif any(w in text for w in ['静音']):
                slots['action'] = 'mute'

        elif intent == 'scene_control':
            slots['scene'] = entities.get('scene', '回家模式')
            slots['action'] = 'activate'

        return slots

    def _calculate_confidence(self, intent, entities, text):
        score = 0.5

        if intent != 'unknown':
            score += 0.2

        score += min(len(entities) * 0.08, 0.3)

        if len(text) > 3:
            score += 0.05

        return min(score, 0.99)

    def _empty_result(self):
        return {
            'intent': 'unknown',
            'entities': {},
            'slots': {},
            'text': '',
            'confidence': 0.0
        }


nlu_service = NLUService()

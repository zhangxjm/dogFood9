from app.database import db
from app.models.models import Conversation
from app.nlu import nlu_service
from app.services.device_service import DeviceService
from app.services.weather_service import WeatherService
from app.services.reminder_service import ReminderService
from app.services.music_service import MusicService
from app.services.scene_service import SceneService
from datetime import datetime
import json
import uuid


class ConversationService:
    session_context = {}

    @staticmethod
    def process_text(user_id, text, session_id=None):
        if not session_id:
            session_id = str(uuid.uuid4())

        nlu_result = nlu_service.parse(text)

        context = ConversationService._get_context(session_id)
        response_data = ConversationService._execute_intent(
            user_id,
            nlu_result['intent'],
            nlu_result['slots'],
            nlu_result['entities'],
            context
        )

        ConversationService._update_context(session_id, nlu_result, response_data)

        conversation = Conversation(
            user_id=user_id,
            session_id=session_id,
            user_input=text,
            bot_response=response_data.get('reply', ''),
            intent=nlu_result['intent'],
            entities=json.dumps(nlu_result['entities'], ensure_ascii=False)
        )
        db.session.add(conversation)
        db.session.commit()

        return {
            'success': True,
            'session_id': session_id,
            'text': text,
            'intent': nlu_result['intent'],
            'entities': nlu_result['entities'],
            'slots': nlu_result['slots'],
            'confidence': nlu_result['confidence'],
            'reply': response_data.get('reply', ''),
            'action_result': response_data.get('result'),
            'need_confirmation': response_data.get('need_confirmation', False)
        }

    @staticmethod
    def process_voice(user_id, audio_data, session_id=None):
        from app.asr import ASRService
        asr_result = ASRService.recognize(audio_data)

        if not asr_result.get('success'):
            return {
                'success': False,
                'error': asr_result.get('error', '语音识别失败'),
                'reply': '抱歉，我没有听清，请再说一遍。'
            }

        text = asr_result.get('text', '')
        result = ConversationService.process_text(user_id, text, session_id)
        result['asr_text'] = text
        result['asr_confidence'] = asr_result.get('confidence', 0.0)
        return result

    @staticmethod
    def _execute_intent(user_id, intent, slots, entities, context):
        handlers = {
            'device_control': ConversationService._handle_device_control,
            'weather_query': ConversationService._handle_weather_query,
            'reminder_set': ConversationService._handle_reminder_set,
            'music_play': ConversationService._handle_music_play,
            'music_control': ConversationService._handle_music_control,
            'scene_control': ConversationService._handle_scene_control,
            'time_query': ConversationService._handle_time_query,
            'greeting': ConversationService._handle_greeting,
            'thanks': ConversationService._handle_thanks,
            'unknown': ConversationService._handle_unknown
        }

        handler = handlers.get(intent, ConversationService._handle_unknown)
        return handler(user_id, slots, entities, context)

    @staticmethod
    def _handle_device_control(user_id, slots, entities, context):
        device_type = slots.get('device_type', 'light')
        room = slots.get('room', '客厅')
        action = slots.get('action', 'turn_on')
        value = slots.get('value')

        params = {}
        if action == 'set' and value is not None:
            if device_type == 'light':
                params['brightness'] = value
            elif device_type == 'ac':
                params['temperature'] = value
            elif device_type in ['speaker', 'tv']:
                params['volume'] = value

        result = DeviceService.control_by_type_and_room(device_type, room, action, **params)

        action_text = {'turn_on': '打开', 'turn_off': '关闭', 'increase': '调高', 'decrease': '调低', 'set': '设置'}.get(action, '控制')
        type_text = {'light': '灯', 'ac': '空调', 'tv': '电视', 'speaker': '音箱', 'curtain': '窗帘', 'robot': '扫地机器人', 'fan': '风扇'}.get(device_type, '设备')

        if result.get('success'):
            reply = f'好的，已为您{action_text}{room}的{type_text}'
            if value is not None:
                reply += f'到{value}'
            reply += '。'
        else:
            reply = f'抱歉，{result.get("message", "无法控制设备")}。'

        return {'reply': reply, 'result': result}

    @staticmethod
    def _handle_weather_query(user_id, slots, entities, context):
        city = slots.get('city', '北京')
        date = slots.get('date')

        result = WeatherService.get_weather(city, date)

        if result.get('success'):
            w = result['weather']
            date_text = date if date else '今天'
            reply = f'{date_text}{city}天气{w["type"]}，{w["temperature_low"]}到{w["temperature_high"]}度。'
            if result.get('tips'):
                reply += result['tips'][0] + '。'
        else:
            reply = f'抱歉，暂时无法获取{city}的天气信息。'

        return {'reply': reply, 'result': result}

    @staticmethod
    def _handle_reminder_set(user_id, slots, entities, context):
        title = slots.get('title', '提醒事项')
        datetime_str = slots.get('datetime')
        repeat_type = slots.get('repeat_type', 'none')

        result = ReminderService.create_reminder(user_id, title, datetime_str, repeat_type=repeat_type)

        if result.get('success'):
            reminder = result['reminder']
            reply = f'好的，我会在{reminder["remind_time"].replace("T", " ")}提醒您{title}。'
        else:
            reply = '抱歉，设置提醒失败，请重试。'

        return {'reply': reply, 'result': result}

    @staticmethod
    def _handle_music_play(user_id, slots, entities, context):
        artist = slots.get('artist')
        song = slots.get('song')

        result = MusicService.play(artist=artist, song=song)

        if result.get('success'):
            current = result.get('current')
            if current:
                if artist:
                    reply = f'好的，正在为您播放{artist}的《{current["title"]}》。'
                elif song:
                    reply = f'好的，正在为您播放《{current["title"]}》。'
                else:
                    reply = f'好的，正在为您播放《{current["title"]}》。'
            else:
                reply = '好的，开始播放音乐。'
        else:
            reply = '抱歉，没有找到相关的音乐。'

        return {'reply': reply, 'result': result}

    @staticmethod
    def _handle_music_control(user_id, slots, entities, context):
        action = slots.get('action', 'pause')
        value = slots.get('value')

        if action == 'pause':
            result = MusicService.pause()
            reply = '已暂停播放。'
        elif action == 'resume':
            result = MusicService.resume()
            reply = '继续播放。'
        elif action == 'next':
            result = MusicService.next()
            current = result.get('current', {})
            reply = f'已切换到下一首：{current.get("title", "")}。'
        elif action == 'prev':
            result = MusicService.prev()
            current = result.get('current', {})
            reply = f'已切换到上一首：{current.get("title", "")}。'
        elif action == 'volume':
            if value is not None:
                result = MusicService.set_volume(value)
                reply = f'音量已调到{value}。'
            else:
                status = MusicService.get_status()
                result = {'success': True, **status}
                reply = f'当前音量是{status["volume"]}。'
        elif action == 'mute':
            result = MusicService.mute()
            reply = '已静音。' if result.get('is_muted') else '已取消静音。'
        else:
            result = {'success': False}
            reply = '抱歉，我不明白您的意思。'

        return {'reply': reply, 'result': result}

    @staticmethod
    def _handle_scene_control(user_id, slots, entities, context):
        scene_name = slots.get('scene', '回家模式')
        result = SceneService.activate_scene_by_name(scene_name)

        if result.get('success'):
            reply = f'好的，已为您切换到{scene_name}。'
        else:
            reply = f'抱歉，{result.get("message", "切换场景失败")}。'

        return {'reply': reply, 'result': result}

    @staticmethod
    def _handle_time_query(user_id, slots, entities, context):
        now = datetime.now()
        weekdays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
        weekday = weekdays[now.weekday()]

        reply = f'现在是{now.year}年{now.month}月{now.day}日 {weekday} {now.hour:02d}:{now.minute:02d}。'
        return {'reply': reply, 'result': {'datetime': now.isoformat()}}

    @staticmethod
    def _handle_greeting(user_id, slots, entities, context):
        import random
        greetings = [
            '你好！有什么可以帮您的吗？',
            '您好！很高兴为您服务。',
            '你好！我是您的语音助手，请问需要什么帮助？',
            '嗨！今天想做什么呢？'
        ]
        reply = random.choice(greetings)
        return {'reply': reply, 'result': None}

    @staticmethod
    def _handle_thanks(user_id, slots, entities, context):
        import random
        replies = [
            '不客气，这是我应该做的。',
            '很高兴能帮到您！',
            '不用谢，随时为您服务。',
            '您太客气了！'
        ]
        reply = random.choice(replies)
        return {'reply': reply, 'result': None}

    @staticmethod
    def _handle_unknown(user_id, slots, entities, context):
        import random
        replies = [
            '抱歉，我不太明白您的意思，可以再说一遍吗？',
            '这个我还不太会，您可以试试控制设备、查询天气、设置提醒或播放音乐。',
            '抱歉，我没有听懂。您可以说"打开客厅的灯"、"今天天气怎么样"等。'
        ]
        reply = random.choice(replies)
        return {'reply': reply, 'result': None}

    @staticmethod
    def _get_context(session_id):
        return ConversationService.session_context.get(session_id, {
            'history': [],
            'pending_action': None
        })

    @staticmethod
    def _update_context(session_id, nlu_result, response):
        ctx = ConversationService._get_context(session_id)
        ctx['history'].append({
            'intent': nlu_result['intent'],
            'entities': nlu_result['entities'],
            'timestamp': datetime.now().isoformat()
        })
        if len(ctx['history']) > 10:
            ctx['history'] = ctx['history'][-10:]
        ConversationService.session_context[session_id] = ctx

    @staticmethod
    def get_history(user_id, limit=20):
        conversations = Conversation.query.filter_by(user_id=user_id)\
            .order_by(Conversation.created_at.desc())\
            .limit(limit)\
            .all()
        return [c.to_dict() for c in reversed(conversations)]

    @staticmethod
    def clear_history(user_id):
        Conversation.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        return {'success': True}

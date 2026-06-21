import os
import tempfile
from flask import current_app


class ASRService:
    @staticmethod
    def recognize(audio_file):
        try:
            if isinstance(audio_file, bytes):
                temp_dir = tempfile.gettempdir()
                audio_path = os.path.join(temp_dir, 'temp_audio.wav')
                with open(audio_path, 'wb') as f:
                    f.write(audio_file)
            else:
                audio_path = audio_file

            text = ASRService._local_recognize(audio_path)

            if not text or text.strip() == '':
                text = '未识别到语音内容'

            return {
                'success': True,
                'text': text,
                'confidence': 0.92
            }
        except Exception as e:
            return {
                'success': False,
                'text': '',
                'error': str(e),
                'confidence': 0.0
            }

    @staticmethod
    def _local_recognize(audio_path):
        sample_texts = [
            '打开客厅的灯',
            '今天天气怎么样',
            '设置一个明天早上8点的闹钟',
            '播放周杰伦的音乐',
            '开启回家模式',
            '关掉卧室的空调',
            '明天北京天气如何',
            '提醒我下午3点开会',
            '音量调大一点',
            '现在几点了'
        ]
        import random
        return random.choice(sample_texts)

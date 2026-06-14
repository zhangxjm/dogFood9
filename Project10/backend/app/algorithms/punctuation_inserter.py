import re
import jieba
from typing import List, Tuple, Dict


class PunctuationInserter:
    def __init__(self):
        self.stop_words = set([
            '也', '矣', '乎', '哉', '焉', '耳', '耶', '与', '欤', '而已',
            '者', '也', '兮', '夫', '盖', '故', '然', '则', '而',
            '曰', '云', '言', '谓', '说', '道', '问', '对', '答'
        ])
        
        self.sentence_end_chars = set([
            '也', '矣', '乎', '哉', '焉', '耳', '耶', '与', '欤',
            '之', '者', '云', '曰'
        ])
        
        self.pause_chars = set([
            '而', '则', '然', '故', '虽', '若', '如', '况', '且',
            '但', '然', '然而', '然则', '是故', '是以', '故曰'
        ])
    
    def insert_punctuation(self, text: str) -> Tuple[str, List[dict]]:
        if not text:
            return text, []
        
        result_text = text
        insertions = []
        offset = 0
        
        insertions.extend(self._insert_periods(text))
        insertions.extend(self._insert_commas(text))
        insertions.extend(self._insert_colons(text))
        insertions.extend(self._insert_question_marks(text))
        
        insertions.sort(key=lambda x: x['position'])
        
        result = []
        last_pos = 0
        for ins in insertions:
            pos = ins['position'] + offset
            result.append(text[last_pos:ins['position']])
            result.append(ins['punctuation'])
            offset += len(ins['punctuation'])
            last_pos = ins['position']
        result.append(text[last_pos:])
        
        return ''.join(result), insertions
    
    def _insert_periods(self, text: str) -> List[dict]:
        insertions = []
        for i, char in enumerate(text):
            if i == len(text) - 1:
                continue
            
            if char in self.sentence_end_chars:
                next_char = text[i + 1] if i + 1 < len(text) else ''
                if next_char and not self._is_punctuation(next_char) and not next_char.isspace():
                    if self._should_insert_period(text, i):
                        insertions.append({
                            'position': i + 1,
                            'punctuation': '。',
                            'type': 'period',
                            'confidence': 0.7
                        })
        return insertions
    
    def _insert_commas(self, text: str) -> List[dict]:
        insertions = []
        for i, char in enumerate(text):
            if i == 0:
                continue
            
            if char in self.pause_chars and i > 0:
                prev_char = text[i - 1] if i - 1 >= 0 else ''
                if prev_char and not self._is_punctuation(prev_char) and not prev_char.isspace():
                    insertions.append({
                        'position': i,
                        'punctuation': '，',
                        'type': 'comma',
                        'confidence': 0.6
                    })
        return insertions
    
    def _insert_colons(self, text: str) -> List[dict]:
        insertions = []
        say_words = ['曰', '云', '言', '谓', '说', '道', '问', '对']
        for word in say_words:
            start = 0
            while True:
                idx = text.find(word, start)
                if idx == -1:
                    break
                pos = idx + len(word)
                if pos < len(text):
                    next_char = text[pos]
                    if not self._is_punctuation(next_char) and not next_char.isspace():
                        insertions.append({
                            'position': pos,
                            'punctuation': '：',
                            'type': 'colon',
                            'confidence': 0.8
                        })
                start = idx + 1
        return insertions
    
    def _insert_question_marks(self, text: str) -> List[dict]:
        insertions = []
        question_words = ['乎', '哉', '耶', '与', '欤', '何也', '何故']
        for word in question_words:
            start = 0
            while True:
                idx = text.find(word, start)
                if idx == -1:
                    break
                pos = idx + len(word)
                if pos < len(text):
                    next_char = text[pos]
                    if not self._is_punctuation(next_char) and not next_char.isspace():
                        insertions.append({
                            'position': pos,
                            'punctuation': '？',
                            'type': 'question',
                            'confidence': 0.75
                        })
                start = idx + 1
        return insertions
    
    def _should_insert_period(self, text: str, pos: int) -> bool:
        if pos >= len(text) - 1:
            return False
        
        window_start = max(0, pos - 5)
        window_end = min(len(text), pos + 3)
        window = text[window_start:window_end]
        
        if '，' in window or '。' in window or '？' in window:
            return False
        
        return True
    
    def _is_punctuation(self, char: str) -> bool:
        punctuations = set('，。！？；：、""''（）【】《》〈〉—…·')
        return char in punctuations
    
    def analyze_text_structure(self, text: str) -> Dict:
        if not text:
            return {'char_count': 0, 'sentences': [], 'paragraphs': []}
        
        chars = list(text)
        sentences = []
        current_sentence = []
        
        for i, char in enumerate(chars):
            current_sentence.append(char)
            if char in ['。', '！', '？', '\n']:
                if current_sentence:
                    sentences.append(''.join(current_sentence).strip())
                    current_sentence = []
        
        if current_sentence:
            sentences.append(''.join(current_sentence).strip())
        
        paragraphs = [p for p in text.split('\n') if p.strip()]
        
        return {
            'char_count': len(text),
            'sentence_count': len(sentences),
            'sentences': sentences,
            'paragraph_count': len(paragraphs),
            'paragraphs': paragraphs
        }

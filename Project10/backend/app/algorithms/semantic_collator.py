import re
import jieba
from typing import List, Dict, Tuple, Optional
from collections import defaultdict


class SemanticCollator:
    def __init__(self):
        self.common_errors = self._load_common_errors()
        self.classical_phrases = self._load_classical_phrases()
    
    def _load_common_errors(self) -> Dict[str, str]:
        errors = {
            '之': ['知', '至', '致', '支'],
            '其': ['齐', '奇', '骑', '棋'],
            '而': ['二', '尔', '耳', '儿'],
            '于': ['与', '予', '余', '鱼'],
            '以': ['已', '矣', '乙', '一'],
            '为': ['谓', '位', '畏', '围'],
            '所': ['索', '锁', '所', '琐'],
            '者': ['这', '着', '著', '诸'],
            '有': ['又', '友', '尤', '由'],
            '无': ['吴', '五', '武', '物'],
            '不': ['步', '部', '布', '捕'],
            '也': ['野', '夜', '叶', '业'],
            '曰': ['日', '月', '越', '约'],
            '云': ['运', '韵', '允', '陨'],
            '亦': ['一', '以', '已', '意'],
            '乃': ['奶', '耐', '奈', '哪'],
            '即': ['既', '及', '级', '极'],
            '则': ['择', '泽', '责', '册'],
            '或': ['惑', '货', '获', '祸'],
            '如': ['入', '儒', '茹', '孺'],
            '若': ['弱', '偌', '箬', '喏'],
            '斯': ['思', '私', '司', '死'],
            '是': ['事', '世', '市', '示'],
            '此': ['次', '刺', '赐', '瓷'],
            '彼': ['比', '笔', '碧', '壁'],
            '夫': ['扶', '服', '浮', '符'],
            '盖': ['概', '钙', '溉', '摡'],
            '故': ['古', '谷', '骨', '鼓'],
            '然': ['燃', '冉', '染', '瓤'],
            '则': ['责', '择', '泽', '啧'],
        }
        return errors
    
    def _load_classical_phrases(self) -> List[str]:
        phrases = [
            '之乎者也',
            '不亦乐乎',
            '温故知新',
            '学而时习之',
            '有朋自远方来',
            '三人行必有我师',
            '己所不欲勿施于人',
            '天行健君子以自强不息',
            '地势坤君子以厚德载物',
            '大学之道在明明德',
            '格物致知',
            '修身齐家治国平天下',
            '得道多助失道寡助',
            '天时不如地利',
            '地利不如人和',
            '生于忧患死于安乐',
            '天将降大任于斯人也',
            '必先苦其心志',
            '劳其筋骨饿其体肤',
            '空乏其身行拂乱其所为',
            '所以动心忍性曾益其所不能',
            '人恒过然后能改',
            '困于心衡于虑而后作',
            '征于色发于声而后喻',
            '入则无法家拂士',
            '出则无敌国外患者',
            '国恒亡然后知生于忧患',
            '而死于安乐也',
            '不以物喜不以己悲',
            '先天下之忧而忧',
            '后天下之乐而乐',
            '醉翁之意不在酒',
            '在乎山水之间也',
            '山水之乐得之心而寓之酒也',
            '落霞与孤鹜齐飞',
            '秋水共长天一色',
            '物华天宝龙光射牛斗之墟',
            '人杰地灵徐孺下陈蕃之榻',
            '老当益壮宁移白首之心',
            '穷且益坚不坠青云之志',
        ]
        return phrases
    
    def collate(self, text: str, context_text: str = '') -> Dict:
        if not text:
            return {
                'corrections': [],
                'suggestions': [],
                'corrected_text': text,
                'confidence': 1.0
            }
        
        corrections = []
        suggestions = []
        
        char_corrections = self._check_common_char_errors(text)
        corrections.extend(char_corrections)
        
        phrase_suggestions = self._check_phrase_completion(text)
        suggestions.extend(phrase_suggestions)
        
        context_suggestions = self._check_context_consistency(text, context_text)
        suggestions.extend(context_suggestions)
        
        corrected_text = self._apply_corrections(text, corrections)
        
        confidence = self._calculate_confidence(text, corrections, suggestions)
        
        return {
            'corrections': corrections,
            'suggestions': suggestions,
            'corrected_text': corrected_text,
            'confidence': confidence
        }
    
    def _check_common_char_errors(self, text: str) -> List[Dict]:
        corrections = []
        
        for i, char in enumerate(text):
            for correct, errors in self.common_errors.items():
                if char in errors:
                    context_before = text[max(0, i-5):i]
                    context_after = text[i+1:min(len(text), i+6)]
                    
                    if self._is_likely_error(char, correct, context_before, context_after):
                        corrections.append({
                            'position': i,
                            'original': char,
                            'suggested': correct,
                            'type': 'common_error',
                            'confidence': 0.6,
                            'reason': '常见形近字错误'
                        })
        
        return corrections
    
    def _check_phrase_completion(self, text: str) -> List[Dict]:
        suggestions = []
        
        for phrase in self.classical_phrases:
            if len(phrase) < 4:
                continue
            
            partial_matches = self._find_partial_matches(text, phrase)
            for match in partial_matches:
                suggestions.append({
                    'position': match['position'],
                    'original': match['matched'],
                    'suggested': phrase,
                    'type': 'phrase_completion',
                    'confidence': 0.5,
                    'reason': f'疑似成语/名句"{phrase}"的部分匹配'
                })
        
        return suggestions
    
    def _check_context_consistency(self, text: str, context_text: str) -> List[Dict]:
        suggestions = []
        
        if not context_text:
            return suggestions
        
        text_words = set(jieba.cut(text))
        context_words = set(jieba.cut(context_text))
        
        common_words = text_words & context_words
        
        if len(common_words) < 3 and len(text) > 20:
            suggestions.append({
                'position': 0,
                'original': text[:50] + '...' if len(text) > 50 else text,
                'suggested': '',
                'type': 'context_consistency',
                'confidence': 0.3,
                'reason': '文本与上下文关联性较低，建议检查是否有错漏'
            })
        
        return suggestions
    
    def _find_partial_matches(self, text: str, phrase: str) -> List[Dict]:
        matches = []
        phrase_len = len(phrase)
        
        if phrase_len < 3:
            return matches
        
        for i in range(len(text) - phrase_len // 2):
            match_len = 0
            for j in range(min(phrase_len, len(text) - i)):
                if text[i + j] == phrase[j]:
                    match_len += 1
                else:
                    break
            
            if match_len >= phrase_len // 2 and match_len < phrase_len:
                matches.append({
                    'position': i,
                    'matched': text[i:i+match_len],
                    'phrase': phrase,
                    'match_ratio': match_len / phrase_len
                })
        
        return matches
    
    def _is_likely_error(self, char: str, correct: str, before: str, after: str) -> bool:
        if len(before) + len(after) < 2:
            return False
        
        combined_before = before + correct
        combined_after = correct + after
        
        classical_patterns = [
            '之', '其', '而', '于', '以', '为', '所', '者', '也', '矣',
            '乎', '哉', '焉', '耳', '耶', '与', '欤'
        ]
        
        for pattern in classical_patterns:
            if pattern in combined_before or pattern in combined_after:
                return True
        
        return False
    
    def _apply_corrections(self, text: str, corrections: List[Dict]) -> str:
        if not corrections:
            return text
        
        high_confidence = [c for c in corrections if c.get('confidence', 0) >= 0.7]
        
        if not high_confidence:
            return text
        
        result = list(text)
        for correction in sorted(high_confidence, key=lambda x: x['position'], reverse=True):
            pos = correction['position']
            if pos < len(result):
                result[pos] = correction['suggested']
        
        return ''.join(result)
    
    def _calculate_confidence(self, text: str, corrections: List[Dict], suggestions: List[Dict]) -> float:
        if not text:
            return 1.0
        
        base_confidence = 0.9
        
        error_ratio = len(corrections) / len(text) if text else 0
        confidence = base_confidence - error_ratio * 0.5
        
        suggestion_penalty = len(suggestions) * 0.02
        confidence -= suggestion_penalty
        
        return max(0.0, min(1.0, confidence))

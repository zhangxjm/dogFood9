from diff_match_patch import diff_match_patch
from typing import List, Dict, Tuple


class TextComparator:
    def __init__(self):
        self.dmp = diff_match_patch()
    
    def compare_texts(self, text1: str, text2: str, label1: str = '版本A', label2: str = '版本B') -> Dict:
        if not text1 and not text2:
            return {'diff': [], 'stats': {'equal': 0, 'insert': 0, 'delete': 0, 'similarity': 1.0}}
        
        diffs = self.dmp.diff_main(text1, text2)
        self.dmp.diff_cleanupSemantic(diffs)
        
        result = []
        pos1 = 0
        pos2 = 0
        
        for op, text in diffs:
            item = {
                'operation': self._op_to_string(op),
                'text': text,
                'position_a': pos1 if op <= 0 else None,
                'position_b': pos2 if op >= 0 else None,
                'length': len(text)
            }
            result.append(item)
            
            if op <= 0:
                pos1 += len(text)
            if op >= 0:
                pos2 += len(text)
        
        stats = self._calculate_stats(diffs, text1, text2)
        
        return {
            'label1': label1,
            'label2': label2,
            'diff': result,
            'stats': stats
        }
    
    def compare_versions(self, version1: Dict, version2: Dict) -> Dict:
        text1 = version1.get('text', '')
        text2 = version2.get('text', '')
        label1 = version1.get('version_name', '版本1')
        label2 = version2.get('version_name', '版本2')
        
        result = self.compare_texts(text1, text2, label1, label2)
        result['version1'] = {
            'id': version1.get('id'),
            'name': label1,
            'page_count': version1.get('page_count', 0)
        }
        result['version2'] = {
            'id': version2.get('id'),
            'name': label2,
            'page_count': version2.get('page_count', 0)
        }
        
        return result
    
    def compare_pages(self, pages1: List[Dict], pages2: List[Dict]) -> List[Dict]:
        results = []
        max_pages = max(len(pages1), len(pages2))
        
        for i in range(max_pages):
            page1 = pages1[i] if i < len(pages1) else None
            page2 = pages2[i] if i < len(pages2) else None
            
            text1 = page1.get('ocr_text', '') if page1 else ''
            text2 = page2.get('ocr_text', '') if page2 else ''
            
            label1 = f"第{i+1}页(版本1)" if page1 else "无"
            label2 = f"第{i+1}页(版本2)" if page2 else "无"
            
            comparison = self.compare_texts(text1, text2, label1, label2)
            comparison['page_number'] = i + 1
            comparison['page1_id'] = page1.get('id') if page1 else None
            comparison['page2_id'] = page2.get('id') if page2 else None
            
            results.append(comparison)
        
        return results
    
    def find_differences_by_type(self, text1: str, text2: str, diff_type: str = 'all') -> List[Dict]:
        comparison = self.compare_texts(text1, text2)
        
        if diff_type == 'all':
            return [d for d in comparison['diff'] if d['operation'] != 'equal']
        elif diff_type == 'insert':
            return [d for d in comparison['diff'] if d['operation'] == 'insert']
        elif diff_type == 'delete':
            return [d for d in comparison['diff'] if d['operation'] == 'delete']
        else:
            return []
    
    def generate_html_diff(self, text1: str, text2: str) -> str:
        diffs = self.dmp.diff_main(text1, text2)
        self.dmp.diff_cleanupSemantic(diffs)
        return self.dmp.diff_prettyHtml(diffs)
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        if not text1 and not text2:
            return 1.0
        if not text1 or not text2:
            return 0.0
        
        distance = self._levenshtein_distance(text1, text2)
        max_len = max(len(text1), len(text2))
        
        if max_len == 0:
            return 1.0
        
        return 1.0 - (distance / max_len)
    
    def _levenshtein_distance(self, s1: str, s2: str) -> int:
        if len(s1) < len(s2):
            return self._levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = list(range(len(s2) + 1))
        
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]
    
    def _op_to_string(self, op: int) -> str:
        if op == -1:
            return 'delete'
        elif op == 0:
            return 'equal'
        elif op == 1:
            return 'insert'
        return 'unknown'
    
    def _calculate_stats(self, diffs: List, text1: str, text2: str) -> Dict:
        equal = 0
        insert = 0
        delete = 0
        
        for op, text in diffs:
            if op == -1:
                delete += len(text)
            elif op == 0:
                equal += len(text)
            elif op == 1:
                insert += len(text)
        
        similarity = self.calculate_similarity(text1, text2)
        
        return {
            'equal': equal,
            'insert': insert,
            'delete': delete,
            'total_chars_a': len(text1),
            'total_chars_b': len(text2),
            'similarity': similarity
        }

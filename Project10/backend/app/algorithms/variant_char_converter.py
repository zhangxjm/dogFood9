import json
import os
from typing import Dict, List, Tuple, Optional


class VariantCharConverter:
    def __init__(self, data_file: str = None):
        self.variant_to_standard: Dict[str, str] = {}
        self.standard_to_variants: Dict[str, List[str]] = {}
        self.data_file = data_file
        
    def load_from_json(self, filepath: str) -> None:
        if not os.path.exists(filepath):
            return
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for item in data:
            std = item.get('standard_char', '')
            var = item.get('variant_char', '')
            if std and var:
                self.variant_to_standard[var] = std
                if std not in self.standard_to_variants:
                    self.standard_to_variants[std] = []
                if var not in self.standard_to_variants[std]:
                    self.standard_to_variants[std].append(var)
    
    def load_from_db(self, variant_chars: List[dict]) -> None:
        for item in variant_chars:
            std = item.get('standard_char', '')
            var = item.get('variant_char', '')
            if std and var:
                self.variant_to_standard[var] = std
                if std not in self.standard_to_variants:
                    self.standard_to_variants[std] = []
                if var not in self.standard_to_variants[std]:
                    self.standard_to_variants[std].append(var)
    
    def convert_to_standard(self, text: str) -> Tuple[str, List[dict]]:
        if not text:
            return text, []
        
        result = []
        changes = []
        position = 0
        
        for char in text:
            if char in self.variant_to_standard:
                standard_char = self.variant_to_standard[char]
                result.append(standard_char)
                changes.append({
                    'position': position,
                    'original': char,
                    'standard': standard_char,
                    'type': 'variant_char'
                })
            else:
                result.append(char)
            position += 1
        
        return ''.join(result), changes
    
    def get_variants(self, char: str) -> List[str]:
        return self.standard_to_variants.get(char, [])
    
    def is_variant(self, char: str) -> bool:
        return char in self.variant_to_standard
    
    def get_standard(self, variant_char: str) -> Optional[str]:
        return self.variant_to_standard.get(variant_char)
    
    def get_stats(self) -> dict:
        return {
            'variant_count': len(self.variant_to_standard),
            'standard_count': len(self.standard_to_variants)
        }

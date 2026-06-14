from elasticsearch import Elasticsearch
from flask import current_app


class ElasticsearchService:
    def __init__(self, app=None):
        self.es = None
        self.available = False
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        host = app.config.get('ELASTICSEARCH_HOST', 'localhost')
        port = app.config.get('ELASTICSEARCH_PORT', 9200)
        use_ssl = app.config.get('ELASTICSEARCH_USE_SSL', False)
        
        try:
            self.es = Elasticsearch(
                [{'host': host, 'port': port, 'scheme': 'https' if use_ssl else 'http'}],
                timeout=30
            )
            self.available = self.es.ping()
        except Exception as e:
            print(f"Elasticsearch connection failed: {e}")
            self.available = False
        
        self.books_index = app.config.get('ES_INDEX_BOOKS', 'ancient_books')
        self.pages_index = app.config.get('ES_INDEX_PAGES', 'ancient_book_pages')
    
    def is_available(self):
        if not self.es:
            return False
        try:
            return self.es.ping()
        except:
            return False
    
    def create_indices(self):
        if not self.is_available():
            return False
        
        books_mapping = {
            'mappings': {
                'properties': {
                    'id': {'type': 'integer'},
                    'title': {'type': 'text', 'analyzer': 'ik_max_word', 'search_analyzer': 'ik_smart'},
                    'author': {'type': 'text', 'analyzer': 'ik_max_word'},
                    'dynasty': {'type': 'keyword'},
                    'description': {'type': 'text', 'analyzer': 'ik_max_word'},
                    'created_at': {'type': 'date'}
                }
            }
        }
        
        pages_mapping = {
            'mappings': {
                'properties': {
                    'id': {'type': 'integer'},
                    'book_id': {'type': 'integer'},
                    'page_number': {'type': 'integer'},
                    'ocr_text': {'type': 'text', 'analyzer': 'ik_max_word', 'search_analyzer': 'ik_smart'},
                    'corrected_text': {'type': 'text', 'analyzer': 'ik_max_word'},
                    'created_at': {'type': 'date'}
                }
            }
        }
        
        try:
            if not self.es.indices.exists(index=self.books_index):
                self.es.indices.create(index=self.books_index, body=books_mapping)
            
            if not self.es.indices.exists(index=self.pages_index):
                self.es.indices.create(index=self.pages_index, body=pages_mapping)
            
            return True
        except Exception as e:
            print(f"Create indices failed: {e}")
            return False
    
    def index_book(self, book_data):
        if not self.is_available():
            return False
        
        try:
            self.es.index(
                index=self.books_index,
                id=book_data['id'],
                body={
                    'id': book_data['id'],
                    'title': book_data.get('title', ''),
                    'author': book_data.get('author', ''),
                    'dynasty': book_data.get('dynasty', ''),
                    'description': book_data.get('description', ''),
                    'created_at': book_data.get('created_at')
                }
            )
            return True
        except Exception as e:
            print(f"Index book failed: {e}")
            return False
    
    def index_books(self, books_data):
        if not self.is_available():
            return 0
        
        count = 0
        for book in books_data:
            if self.index_book(book):
                count += 1
        return count
    
    def index_page(self, page_data):
        if not self.is_available():
            return False
        
        try:
            self.es.index(
                index=self.pages_index,
                id=page_data['id'],
                body={
                    'id': page_data['id'],
                    'book_id': page_data.get('book_id'),
                    'page_number': page_data.get('page_number'),
                    'ocr_text': page_data.get('ocr_text', ''),
                    'corrected_text': page_data.get('corrected_text', ''),
                    'created_at': page_data.get('created_at')
                }
            )
            return True
        except Exception as e:
            print(f"Index page failed: {e}")
            return False
    
    def index_pages(self, pages_data):
        if not self.is_available():
            return 0
        
        count = 0
        for page in pages_data:
            if self.index_page(page):
                count += 1
        return count
    
    def search(self, query, page=1, per_page=20, dynasty=None, author=None, search_type='all'):
        if not self.is_available():
            return {'results': [], 'total': 0}
        
        results = []
        total = 0
        
        try:
            if search_type in ['all', 'books']:
                book_query = {
                    'query': {
                        'bool': {
                            'must': [
                                {'multi_match': {
                                    'query': query,
                                    'fields': ['title^3', 'author^2', 'description'],
                                    'type': 'best_fields'
                                }}
                            ],
                            'filter': []
                        }
                    },
                    'from': (page - 1) * per_page,
                    'size': per_page,
                    'highlight': {
                        'fields': {
                            'title': {},
                            'author': {},
                            'description': {}
                        }
                    }
                }
                
                if dynasty:
                    book_query['query']['bool']['filter'].append(
                        {'term': {'dynasty': dynasty}}
                    )
                if author:
                    book_query['query']['bool']['filter'].append(
                        {'match': {'author': author}}
                    )
                
                book_resp = self.es.search(index=self.books_index, body=book_query)
                
                for hit in book_resp['hits']['hits']:
                    source = hit['_source']
                    highlight = hit.get('highlight', {})
                    
                    results.append({
                        'type': 'book',
                        'id': source['id'],
                        'title': source.get('title', ''),
                        'author': source.get('author', ''),
                        'dynasty': source.get('dynasty', ''),
                        'snippet': self._get_snippet(highlight, source.get('description', '')),
                        'score': hit['_score']
                    })
                
                total += book_resp['hits']['total']['value'] if isinstance(book_resp['hits']['total'], dict) else book_resp['hits']['total']
            
            if search_type in ['all', 'pages']:
                page_query = {
                    'query': {
                        'multi_match': {
                            'query': query,
                            'fields': ['ocr_text', 'corrected_text'],
                            'type': 'best_fields'
                        }
                    },
                    'from': (page - 1) * per_page,
                    'size': per_page,
                    'highlight': {
                        'fields': {
                            'ocr_text': {},
                            'corrected_text': {}
                        }
                    }
                }
                
                page_resp = self.es.search(index=self.pages_index, body=page_query)
                
                for hit in page_resp['hits']['hits']:
                    source = hit['_source']
                    highlight = hit.get('highlight', {})
                    
                    results.append({
                        'type': 'page',
                        'id': source['id'],
                        'book_id': source.get('book_id'),
                        'page_number': source.get('page_number'),
                        'snippet': self._get_snippet(highlight, source.get('ocr_text', '')),
                        'score': hit['_score']
                    })
                
                total += page_resp['hits']['total']['value'] if isinstance(page_resp['hits']['total'], dict) else page_resp['hits']['total']
            
            results.sort(key=lambda x: x.get('score', 0), reverse=True)
            
        except Exception as e:
            print(f"Search failed: {e}")
        
        return {
            'results': results[:per_page],
            'total': total,
            'page': page,
            'per_page': per_page
        }
    
    def suggest(self, query, size=10):
        if not self.is_available():
            return []
        
        suggestions = []
        
        try:
            suggest_query = {
                'suggest': {
                    'title-suggest': {
                        'prefix': query,
                        'completion': {
                            'field': 'title',
                            'size': size
                        }
                    }
                }
            }
            
            resp = self.es.search(index=self.books_index, body=suggest_query)
            
            if 'suggest' in resp and 'title-suggest' in resp['suggest']:
                for option in resp['suggest']['title-suggest'][0].get('options', []):
                    suggestions.append({
                        'text': option['text'],
                        'type': 'book_title',
                        'score': option['_score']
                    })
        
        except Exception as e:
            print(f"Suggest failed: {e}")
        
        return suggestions
    
    def _get_snippet(self, highlight, default_text):
        for field in ['title', 'ocr_text', 'corrected_text', 'description', 'author']:
            if field in highlight:
                return '...'.join(highlight[field])
        
        return default_text[:200] if default_text else ''


_es_service = None


def get_es_service():
    global _es_service
    if _es_service is None:
        _es_service = ElasticsearchService()
    return _es_service

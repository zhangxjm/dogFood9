from flask import Blueprint, request, jsonify

search_bp = Blueprint('search', __name__)


@search_bp.route('/', methods=['GET'])
def search():
    query = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    dynasty = request.args.get('dynasty')
    author = request.args.get('author')
    search_type = request.args.get('type', 'all')
    
    from app.services.es_service import get_es_service
    
    es_service = get_es_service()
    
    if not es_service.is_available():
        from app.models import Book, BookPage
        from app import db
        
        results = []
        
        if search_type in ['all', 'books']:
            book_query = Book.query.filter(
                db.or_(
                    Book.title.like(f'%{query}%'),
                    Book.description.like(f'%{query}%'),
                    Book.author.like(f'%{query}%')
                )
            )
            if dynasty:
                book_query = book_query.filter(Book.dynasty == dynasty)
            if author:
                book_query = book_query.filter(Book.author.like(f'%{author}%'))
            
            books = book_query.all()
            for book in books:
                results.append({
                    'type': 'book',
                    'id': book.id,
                    'title': book.title,
                    'author': book.author,
                    'dynasty': book.dynasty,
                    'snippet': book.description[:200] if book.description else ''
                })
        
        if search_type in ['all', 'pages']:
            page_query = BookPage.query.filter(
                db.or_(
                    BookPage.ocr_text.like(f'%{query}%'),
                    BookPage.corrected_text.like(f'%{query}%')
                )
            )
            pages = page_query.limit(per_page).all()
            for p in pages:
                book = Book.query.get(p.book_id)
                text = p.ocr_text or p.corrected_text or ''
                idx = text.find(query)
                snippet = text[max(0, idx-50):idx+len(query)+50] if idx >= 0 else text[:200]
                
                results.append({
                    'type': 'page',
                    'id': p.id,
                    'book_id': p.book_id,
                    'book_title': book.title if book else '',
                    'page_number': p.page_number,
                    'snippet': snippet
                })
        
        return jsonify({
            'results': results[:per_page],
            'total': len(results),
            'page': page,
            'per_page': per_page,
            'backend': 'sqlite'
        })
    
    result = es_service.search(
        query=query,
        page=page,
        per_page=per_page,
        dynasty=dynasty,
        author=author,
        search_type=search_type
    )
    
    result['backend'] = 'elasticsearch'
    return jsonify(result)


@search_bp.route('/suggest', methods=['GET'])
def suggest():
    query = request.args.get('q', '')
    size = request.args.get('size', 10, type=int)
    
    if len(query) < 2:
        return jsonify({'suggestions': []})
    
    from app.services.es_service import get_es_service
    
    es_service = get_es_service()
    
    if not es_service.is_available():
        from app.models import Book
        from app import db
        
        books = Book.query.filter(
            Book.title.like(f'%{query}%')
        ).limit(size).all()
        
        suggestions = [
            {'text': book.title, 'type': 'book_title'}
            for book in books
        ]
        
        return jsonify({'suggestions': suggestions})
    
    suggestions = es_service.suggest(query, size)
    return jsonify({'suggestions': suggestions})


@search_bp.route('/reindex', methods=['POST'])
def reindex():
    from app.services.es_service import get_es_service
    from app.models import Book, BookPage
    
    es_service = get_es_service()
    
    if not es_service.is_available():
        return jsonify({'error': 'Elasticsearch is not available'}), 503
    
    books = Book.query.all()
    pages = BookPage.query.all()
    
    books_indexed = es_service.index_books([book.to_dict() for book in books])
    pages_indexed = es_service.index_pages([page.to_dict() for page in pages])
    
    return jsonify({
        'message': 'Reindex completed',
        'books_indexed': books_indexed,
        'pages_indexed': pages_indexed
    })

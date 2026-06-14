from flask import Blueprint, request, jsonify
from app import db
from app.models import Book, BookPage, BookVersion

books_bp = Blueprint('books', __name__)


@books_bp.route('/', methods=['GET'])
def get_books():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    dynasty = request.args.get('dynasty')
    author = request.args.get('author')
    keyword = request.args.get('keyword')
    
    query = Book.query
    
    if dynasty:
        query = query.filter(Book.dynasty == dynasty)
    if author:
        query = query.filter(Book.author.like(f'%{author}%'))
    if keyword:
        query = query.filter(
            db.or_(
                Book.title.like(f'%{keyword}%'),
                Book.description.like(f'%{keyword}%'),
                Book.author.like(f'%{keyword}%')
            )
        )
    
    pagination = query.order_by(Book.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'books': [book.to_dict() for book in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    })


@books_bp.route('/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    return jsonify(book.to_dict())


@books_bp.route('/', methods=['POST'])
def create_book():
    data = request.get_json()
    
    book = Book(
        title=data.get('title', ''),
        author=data.get('author'),
        dynasty=data.get('dynasty'),
        description=data.get('description')
    )
    
    db.session.add(book)
    db.session.commit()
    
    return jsonify(book.to_dict()), 201


@books_bp.route('/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    book = Book.query.get_or_404(book_id)
    data = request.get_json()
    
    if 'title' in data:
        book.title = data['title']
    if 'author' in data:
        book.author = data['author']
    if 'dynasty' in data:
        book.dynasty = data['dynasty']
    if 'description' in data:
        book.description = data['description']
    
    db.session.commit()
    
    return jsonify(book.to_dict())


@books_bp.route('/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    db.session.delete(book)
    db.session.commit()
    
    return jsonify({'message': 'Book deleted successfully'})


@books_bp.route('/<int:book_id>/pages', methods=['GET'])
def get_book_pages(book_id):
    book = Book.query.get_or_404(book_id)
    version_id = request.args.get('version_id', type=int)
    
    query = BookPage.query.filter_by(book_id=book_id)
    if version_id:
        query = query.filter_by(version_id=version_id)
    
    pages = query.order_by(BookPage.page_number).all()
    
    return jsonify({
        'pages': [page.to_dict() for page in pages],
        'total': len(pages)
    })


@books_bp.route('/<int:book_id>/pages', methods=['POST'])
def add_book_page(book_id):
    book = Book.query.get_or_404(book_id)
    data = request.get_json()
    
    page = BookPage(
        book_id=book_id,
        version_id=data.get('version_id'),
        page_number=data.get('page_number', 1),
        ocr_text=data.get('ocr_text', ''),
        corrected_text=data.get('corrected_text'),
        image_path=data.get('image_path')
    )
    
    db.session.add(page)
    db.session.commit()
    
    return jsonify(page.to_dict()), 201


@books_bp.route('/pages/<int:page_id>', methods=['GET'])
def get_page(page_id):
    page = BookPage.query.get_or_404(page_id)
    result = page.to_dict()
    result['annotations'] = [ann.to_dict() for ann in page.annotations]
    return jsonify(result)


@books_bp.route('/pages/<int:page_id>', methods=['PUT'])
def update_page(page_id):
    page = BookPage.query.get_or_404(page_id)
    data = request.get_json()
    
    if 'ocr_text' in data:
        page.ocr_text = data['ocr_text']
    if 'corrected_text' in data:
        page.corrected_text = data['corrected_text']
    if 'image_path' in data:
        page.image_path = data['image_path']
    
    db.session.commit()
    
    return jsonify(page.to_dict())


@books_bp.route('/<int:book_id>/versions', methods=['GET'])
def get_book_versions(book_id):
    book = Book.query.get_or_404(book_id)
    versions = BookVersion.query.filter_by(book_id=book_id).all()
    
    return jsonify({
        'versions': [v.to_dict() for v in versions],
        'total': len(versions)
    })


@books_bp.route('/<int:book_id>/versions', methods=['POST'])
def create_book_version(book_id):
    book = Book.query.get_or_404(book_id)
    data = request.get_json()
    
    version = BookVersion(
        book_id=book_id,
        version_name=data.get('version_name', ''),
        version_type=data.get('version_type'),
        source=data.get('source'),
        description=data.get('description')
    )
    
    db.session.add(version)
    db.session.commit()
    
    return jsonify(version.to_dict()), 201


@books_bp.route('/dynasties', methods=['GET'])
def get_dynasties():
    dynasties = db.session.query(Book.dynasty).filter(
        Book.dynasty.isnot(None)
    ).distinct().all()
    
    return jsonify({
        'dynasties': [d[0] for d in dynasties if d[0]]
    })

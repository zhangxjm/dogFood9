from datetime import datetime
from app import db

class Book(db.Model):
    __tablename__ = 'books'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255))
    dynasty = db.Column(db.String(100))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    pages = db.relationship('BookPage', backref='book', lazy=True, cascade='all, delete-orphan')
    versions = db.relationship('BookVersion', backref='book', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'dynasty': self.dynasty,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'page_count': len(self.pages)
        }

class BookVersion(db.Model):
    __tablename__ = 'book_versions'
    
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    version_name = db.Column(db.String(255), nullable=False)
    version_type = db.Column(db.String(50))
    source = db.Column(db.String(255))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    pages = db.relationship('BookPage', backref='version', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'version_name': self.version_name,
            'version_type': self.version_type,
            'source': self.source,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class BookPage(db.Model):
    __tablename__ = 'book_pages'
    
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    version_id = db.Column(db.Integer, db.ForeignKey('book_versions.id'))
    page_number = db.Column(db.Integer, nullable=False)
    ocr_text = db.Column(db.Text)
    corrected_text = db.Column(db.Text)
    image_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    annotations = db.relationship('Annotation', backref='page', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'version_id': self.version_id,
            'page_number': self.page_number,
            'ocr_text': self.ocr_text,
            'corrected_text': self.corrected_text,
            'image_path': self.image_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Annotation(db.Model):
    __tablename__ = 'annotations'
    
    id = db.Column(db.Integer, primary_key=True)
    page_id = db.Column(db.Integer, db.ForeignKey('book_pages.id'), nullable=False)
    annotation_type = db.Column(db.String(50), nullable=False)
    start_position = db.Column(db.Integer)
    end_position = db.Column(db.Integer)
    original_text = db.Column(db.String(500))
    corrected_text = db.Column(db.String(500))
    comment = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')
    created_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'page_id': self.page_id,
            'annotation_type': self.annotation_type,
            'start_position': self.start_position,
            'end_position': self.end_position,
            'original_text': self.original_text,
            'corrected_text': self.corrected_text,
            'comment': self.comment,
            'status': self.status,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class VariantChar(db.Model):
    __tablename__ = 'variant_chars'
    
    id = db.Column(db.Integer, primary_key=True)
    standard_char = db.Column(db.String(10), nullable=False, index=True)
    variant_char = db.Column(db.String(10), nullable=False, index=True)
    variant_type = db.Column(db.String(50))
    source = db.Column(db.String(255))
    description = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'standard_char': self.standard_char,
            'variant_char': self.variant_char,
            'variant_type': self.variant_type,
            'source': self.source,
            'description': self.description
        }

class CollationHistory(db.Model):
    __tablename__ = 'collation_history'
    
    id = db.Column(db.Integer, primary_key=True)
    page_id = db.Column(db.Integer, db.ForeignKey('book_pages.id'))
    action_type = db.Column(db.String(50), nullable=False)
    before_text = db.Column(db.Text)
    after_text = db.Column(db.Text)
    operator = db.Column(db.String(100))
    operation_time = db.Column(db.DateTime, default=datetime.utcnow)
    remark = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'page_id': self.page_id,
            'action_type': self.action_type,
            'before_text': self.before_text,
            'after_text': self.after_text,
            'operator': self.operator,
            'operation_time': self.operation_time.isoformat() if self.operation_time else None,
            'remark': self.remark
        }

from flask import Blueprint, request, jsonify
from app import db
from app.models import BookPage, Annotation, VariantChar
from app.algorithms import VariantCharConverter, PunctuationInserter, TextComparator, SemanticCollator

collation_bp = Blueprint('collation', __name__)

_variant_converter = None
_punctuation_inserter = None
_text_comparator = None
_semantic_collator = None


def get_variant_converter():
    global _variant_converter
    if _variant_converter is None:
        _variant_converter = VariantCharConverter()
        variant_chars = VariantChar.query.all()
        _variant_converter.load_from_db([vc.to_dict() for vc in variant_chars])
    return _variant_converter


def get_punctuation_inserter():
    global _punctuation_inserter
    if _punctuation_inserter is None:
        _punctuation_inserter = PunctuationInserter()
    return _punctuation_inserter


def get_text_comparator():
    global _text_comparator
    if _text_comparator is None:
        _text_comparator = TextComparator()
    return _text_comparator


def get_semantic_collator():
    global _semantic_collator
    if _semantic_collator is None:
        _semantic_collator = SemanticCollator()
    return _semantic_collator


@collation_bp.route('/convert-variants', methods=['POST'])
def convert_variants():
    data = request.get_json()
    text = data.get('text', '')
    
    converter = get_variant_converter()
    result_text, changes = converter.convert_to_standard(text)
    
    return jsonify({
        'original_text': text,
        'converted_text': result_text,
        'changes': changes,
        'change_count': len(changes)
    })


@collation_bp.route('/insert-punctuation', methods=['POST'])
def insert_punctuation():
    data = request.get_json()
    text = data.get('text', '')
    
    inserter = get_punctuation_inserter()
    result_text, insertions = inserter.insert_punctuation(text)
    structure = inserter.analyze_text_structure(result_text)
    
    return jsonify({
        'original_text': text,
        'punctuated_text': result_text,
        'insertions': insertions,
        'insertion_count': len(insertions),
        'structure': structure
    })


@collation_bp.route('/compare', methods=['POST'])
def compare_texts():
    data = request.get_json()
    text1 = data.get('text1', '')
    text2 = data.get('text2', '')
    label1 = data.get('label1', '版本A')
    label2 = data.get('label2', '版本B')
    
    comparator = get_text_comparator()
    result = comparator.compare_texts(text1, text2, label1, label2)
    
    return jsonify(result)


@collation_bp.route('/compare-versions', methods=['POST'])
def compare_versions():
    data = request.get_json()
    version1_id = data.get('version1_id')
    version2_id = data.get('version2_id')
    
    from app.models import BookVersion
    
    v1 = BookVersion.query.get(version1_id)
    v2 = BookVersion.query.get(version2_id)
    
    if not v1 or not v2:
        return jsonify({'error': 'Version not found'}), 404
    
    pages1 = BookPage.query.filter_by(version_id=version1_id).order_by(BookPage.page_number).all()
    pages2 = BookPage.query.filter_by(version_id=version2_id).order_by(BookPage.page_number).all()
    
    comparator = get_text_comparator()
    results = comparator.compare_pages(
        [p.to_dict() for p in pages1],
        [p.to_dict() for p in pages2]
    )
    
    text1 = '\n'.join([p.ocr_text or '' for p in pages1])
    text2 = '\n'.join([p.ocr_text or '' for p in pages2])
    overall_stats = comparator.compare_texts(text1, text2, v1.version_name, v2.version_name)
    
    return jsonify({
        'version1': v1.to_dict(),
        'version2': v2.to_dict(),
        'page_comparisons': results,
        'overall_stats': overall_stats['stats']
    })


@collation_bp.route('/semantic-collate', methods=['POST'])
def semantic_collate():
    data = request.get_json()
    text = data.get('text', '')
    context_text = data.get('context_text', '')
    
    collator = get_semantic_collator()
    result = collator.collate(text, context_text)
    
    return jsonify(result)


@collation_bp.route('/auto-collate', methods=['POST'])
def auto_collate():
    data = request.get_json()
    text = data.get('text', '')
    context_text = data.get('context_text', '')
    steps = data.get('steps', ['variants', 'punctuation', 'semantic'])
    
    current_text = text
    all_changes = []
    all_insertions = []
    all_suggestions = []
    
    if 'variants' in steps:
        converter = get_variant_converter()
        current_text, changes = converter.convert_to_standard(current_text)
        all_changes.extend(changes)
    
    if 'punctuation' in steps:
        inserter = get_punctuation_inserter()
        current_text, insertions = inserter.insert_punctuation(current_text)
        all_insertions.extend(insertions)
    
    if 'semantic' in steps:
        collator = get_semantic_collator()
        semantic_result = collator.collate(current_text, context_text)
        current_text = semantic_result['corrected_text']
        all_suggestions.extend(semantic_result['suggestions'])
    
    return jsonify({
        'original_text': text,
        'collated_text': current_text,
        'variant_changes': all_changes,
        'punctuation_insertions': all_insertions,
        'semantic_suggestions': all_suggestions,
        'total_changes': len(all_changes) + len(all_insertions) + len(all_suggestions)
    })


@collation_bp.route('/pages/<int:page_id>/annotations', methods=['GET'])
def get_annotations(page_id):
    page = BookPage.query.get_or_404(page_id)
    annotations = Annotation.query.filter_by(page_id=page_id).all()
    
    return jsonify({
        'annotations': [ann.to_dict() for ann in annotations],
        'total': len(annotations)
    })


@collation_bp.route('/pages/<int:page_id>/annotations', methods=['POST'])
def add_annotation(page_id):
    page = BookPage.query.get_or_404(page_id)
    data = request.get_json()
    
    annotation = Annotation(
        page_id=page_id,
        annotation_type=data.get('annotation_type', 'error'),
        start_position=data.get('start_position'),
        end_position=data.get('end_position'),
        original_text=data.get('original_text'),
        corrected_text=data.get('corrected_text'),
        comment=data.get('comment'),
        status=data.get('status', 'pending'),
        created_by=data.get('created_by')
    )
    
    db.session.add(annotation)
    db.session.commit()
    
    return jsonify(annotation.to_dict()), 201


@collation_bp.route('/annotations/<int:annotation_id>', methods=['PUT'])
def update_annotation(annotation_id):
    annotation = Annotation.query.get_or_404(annotation_id)
    data = request.get_json()
    
    if 'annotation_type' in data:
        annotation.annotation_type = data['annotation_type']
    if 'corrected_text' in data:
        annotation.corrected_text = data['corrected_text']
    if 'comment' in data:
        annotation.comment = data['comment']
    if 'status' in data:
        annotation.status = data['status']
    
    db.session.commit()
    
    return jsonify(annotation.to_dict())


@collation_bp.route('/annotations/<int:annotation_id>', methods=['DELETE'])
def delete_annotation(annotation_id):
    annotation = Annotation.query.get_or_404(annotation_id)
    db.session.delete(annotation)
    db.session.commit()
    
    return jsonify({'message': 'Annotation deleted successfully'})


@collation_bp.route('/variant-chars', methods=['GET'])
def get_variant_chars():
    char = request.args.get('char')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    query = VariantChar.query
    
    if char:
        query = query.filter(
            db.or_(
                VariantChar.standard_char == char,
                VariantChar.variant_char == char
            )
        )
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    converter = get_variant_converter()
    stats = converter.get_stats()
    
    return jsonify({
        'variant_chars': [vc.to_dict() for vc in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'stats': stats
    })


@collation_bp.route('/variant-chars/lookup', methods=['GET'])
def lookup_variant_char():
    char = request.args.get('char', '')
    
    converter = get_variant_converter()
    
    result = {
        'char': char,
        'is_variant': converter.is_variant(char),
        'standard': converter.get_standard(char),
        'variants': converter.get_variants(char)
    }
    
    return jsonify(result)

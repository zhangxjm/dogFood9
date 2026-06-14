from flask import Blueprint, request, jsonify
from app import db
from app.models import CollationHistory, BookPage

history_bp = Blueprint('history', __name__)


@history_bp.route('/', methods=['GET'])
def get_history():
    page_id = request.args.get('page_id', type=int)
    action_type = request.args.get('action_type')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = CollationHistory.query
    
    if page_id:
        query = query.filter_by(page_id=page_id)
    if action_type:
        query = query.filter_by(action_type=action_type)
    
    pagination = query.order_by(CollationHistory.operation_time.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'history': [h.to_dict() for h in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    })


@history_bp.route('/', methods=['POST'])
def add_history():
    data = request.get_json()
    
    history = CollationHistory(
        page_id=data.get('page_id'),
        action_type=data.get('action_type', ''),
        before_text=data.get('before_text'),
        after_text=data.get('after_text'),
        operator=data.get('operator'),
        remark=data.get('remark')
    )
    
    db.session.add(history)
    db.session.commit()
    
    return jsonify(history.to_dict()), 201


@history_bp.route('/<int:history_id>', methods=['GET'])
def get_history_item(history_id):
    history = CollationHistory.query.get_or_404(history_id)
    return jsonify(history.to_dict())


@history_bp.route('/pages/<int:page_id>/revert/<int:history_id>', methods=['POST'])
def revert_to_history(page_id, history_id):
    page = BookPage.query.get_or_404(page_id)
    history = CollationHistory.query.get_or_404(history_id)
    
    if history.page_id != page_id:
        return jsonify({'error': 'History does not belong to this page'}), 400
    
    page.corrected_text = history.before_text
    
    revert_history = CollationHistory(
        page_id=page_id,
        action_type='revert',
        before_text=page.corrected_text,
        after_text=history.before_text,
        operator='system',
        remark=f'Reverted to history #{history_id}'
    )
    db.session.add(revert_history)
    db.session.commit()
    
    return jsonify({
        'message': 'Reverted successfully',
        'page': page.to_dict(),
        'revert_history': revert_history.to_dict()
    })

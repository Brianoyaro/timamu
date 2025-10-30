from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, Session, Rating, db
from datetime import datetime

reviews_bp = Blueprint('reviews', __name__)

@reviews_bp.route('/reviews/submit', methods=['POST'])
@jwt_required()
def submit_review():
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        required_fields = ['sessionId', 'therapistId', 'rating', 'review']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Verify the session exists and belongs to the patient
        session = Session.query.get(data['sessionId'])
        if not session:
            return jsonify({'message': 'Session not found'}), 404
            
        if session.patient_id != current_user_id:
            return jsonify({'message': 'Unauthorized to review this session'}), 403
            
        # Check if a review already exists for this session
        existing_review = Rating.query.filter_by(session_id=session.id).first()
        if existing_review:
            return jsonify({'message': 'Review already exists for this session'}), 400

        # Create new review
        new_review = Rating(
            session_id=session.id,
            giver_id=current_user_id,
            receiver_id=data['therapistId'],
            rating=data['rating'],
            review=data['review'],
            is_anonymous=data.get('isAnonymous', False)
        )
        
        db.session.add(new_review)
        db.session.commit()
        
        return jsonify({
            'message': 'Review submitted successfully',
            'review': {
                'id': new_review.id,
                'rating': new_review.rating,
                'review': new_review.review,
                'isAnonymous': new_review.is_anonymous,
                'createdAt': new_review.created_at.isoformat() if hasattr(new_review, 'created_at') else datetime.utcnow().isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@reviews_bp.route('/reviews/therapist/<int:therapist_id>', methods=['GET'])
@jwt_required()
def get_therapist_reviews(therapist_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        reviews = Rating.query.filter_by(receiver_id=therapist_id)\
            .join(User, Rating.giver_id == User.id)\
            .paginate(page=page, per_page=per_page)
            
        reviews_data = []
        for review in reviews.items:
            giver = User.query.get(review.giver_id)
            review_data = {
                'id': review.id,
                'rating': review.rating,
                'review': review.review,
                'isAnonymous': review.is_anonymous,
                'createdAt': review.created_at.isoformat() if hasattr(review, 'created_at') else None,
                'giver': {
                    'name': 'Anonymous' if review.is_anonymous else f"{giver.first_name} {giver.last_name[0]}.",
                }
            }
            reviews_data.append(review_data)
            
        return jsonify({
            'reviews': reviews_data,
            'total': reviews.total,
            'pages': reviews.pages,
            'currentPage': reviews.page
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@reviews_bp.route('/reviews/session/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session_review(session_id):
    try:
        current_user_id = get_jwt_identity()
        session = Session.query.get(session_id)
        
        if not session:
            return jsonify({'message': 'Session not found'}), 404
            
        # Ensure user is part of the session
        if current_user_id not in [session.patient_id, session.therapist_id]:
            return jsonify({'message': 'Unauthorized to view this session review'}), 403
            
        review = Rating.query.filter_by(session_id=session_id).first()
        if not review:
            return jsonify({'message': 'No review found for this session'}), 404
            
        return jsonify({
            'id': review.id,
            'rating': review.rating,
            'review': review.review,
            'isAnonymous': review.is_anonymous,
            'createdAt': review.created_at.isoformat() if hasattr(review, 'created_at') else None
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
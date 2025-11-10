from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
#from ..models.messaging import ConversationThread, ThreadMessage
from ..models import User, ThreadMessage, ConversationThread
from ..extensions import db
from . import messages_bp
import logging

logger = logging.getLogger(__name__)

@messages_bp.route('/conversations', methods=['GET'])
@jwt_required()
def list_conversations():
    """List all conversations for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get conversations based on user role
        if user.role == 'PATIENT':
            threads = ConversationThread.query.filter(
                ConversationThread.patient_id == current_user_id,
                ConversationThread.patient_archived == False
            ).order_by(ConversationThread.last_message_at.desc()).all()
        elif user.role == 'THERAPIST':
            threads = ConversationThread.query.filter(
                ConversationThread.therapist_id == current_user_id,
                ConversationThread.therapist_archived == False
            ).order_by(ConversationThread.last_message_at.desc()).all()
        else:
            return jsonify({'error': 'Invalid user role'}), 400
        
        conversations = []
        for thread in threads:
            # Get other participant
            other_user = thread.therapist if user.role == 'PATIENT' else thread.patient
            
            # Get last message if it exists
            last_message = thread.messages.order_by(ThreadMessage.created_at.desc()).first()
            
            conversations.append({
                'id': thread.id,
                'participant': {
                    'id': other_user.id,
                    'name': f"{other_user.first_name} {other_user.last_name}".strip(),
                    'role': other_user.role
                },
                'last_message': last_message.to_dict() if last_message else None,
                'last_message_at': thread.last_message_at.isoformat() if thread.last_message_at else None,
                'unread_count': thread.get_unread_count(current_user_id),
                'session_id': thread.session_id
            })
        
        return jsonify(conversations)
        
    except Exception as e:
        logger.error(f"Error in list_conversations: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/conversations/<int:thread_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(thread_id):
    """Get messages in a conversation thread"""
    try:
        current_user_id = get_jwt_identity()
        thread = ConversationThread.query.get_or_404(thread_id)
        
        # Check access
        if current_user_id not in [thread.patient_id, thread.therapist_id]:
            return jsonify({'error': 'Unauthorized access'}), 403
        
        # Get all messages for the thread
        messages = ThreadMessage.query.filter_by(thread_id=thread_id)\
            .order_by(ThreadMessage.created_at.desc())\
            .all()
        
        return jsonify({
            'messages': [msg.to_dict() for msg in messages]
        })
        
    except Exception as e:
        logger.error(f"Error in get_messages: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/conversations/<int:thread_id>/messages', methods=['POST'])
@jwt_required()
def send_message(thread_id):
    """Send a message in a conversation thread"""
    try:
        current_user_id = get_jwt_identity()
        thread = ConversationThread.query.get_or_404(thread_id)
        
        # Check access and determine receiver
        if current_user_id == thread.patient_id:
            receiver_id = thread.therapist_id
        elif current_user_id == thread.therapist_id:
            receiver_id = thread.patient_id
        else:
            return jsonify({'error': 'Unauthorized access'}), 403
        
        # Validate input
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': 'Message content is required'}), 400
        
        # Create message
        message = ThreadMessage(
            thread_id=thread_id,
            sender_id=current_user_id,
            receiver_id=receiver_id,
            content=data['content'],
            message_type=data.get('message_type', 'text'),
            attachments=data.get('attachments')
        )
        
        # Update thread
        now = datetime.utcnow()
        thread.last_message_at = now
        thread.updated_at = now
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify(message.to_dict()), 201
        
    except Exception as e:
        logger.error(f"Error in send_message: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/conversations/<int:thread_id>/mark-read', methods=['POST'])
@jwt_required()
def mark_thread_read(thread_id):
    """Mark all messages in a thread as read for the current user"""
    try:
        current_user_id = get_jwt_identity()
        thread = ConversationThread.query.get_or_404(thread_id)
        
        # Check access
        if current_user_id not in [thread.patient_id, thread.therapist_id]:
            return jsonify({'error': 'Unauthorized access'}), 403
            
        # Mark messages as read
        ThreadMessage.query.filter(
            ThreadMessage.thread_id == thread_id,
            ThreadMessage.receiver_id == current_user_id,
            ThreadMessage.is_read == False
        ).update({'is_read': True})
        
        db.session.commit()
        
        return jsonify({'message': 'Messages marked as read'})
        
    except Exception as e:
        logger.error(f"Error in mark_thread_read: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/conversations/<int:thread_id>/archive', methods=['POST'])
@jwt_required()
def archive_conversation(thread_id):
    """Archive a conversation for the current user"""
    try:
        current_user_id = get_jwt_identity()
        thread = ConversationThread.query.get_or_404(thread_id)
        
        # Set archive flag based on user role
        if current_user_id == thread.patient_id:
            thread.patient_archived = True
        elif current_user_id == thread.therapist_id:
            thread.therapist_archived = True
        else:
            return jsonify({'error': 'Unauthorized access'}), 403
        
        # Update timestamp
        thread.updated_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify({'message': 'Conversation archived'})
        
    except Exception as e:
        logger.error(f"Error in archive_conversation: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/conversations/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get total unread messages count for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Count unread messages in all conversations
        unread_count = ThreadMessage.query.filter(
            ThreadMessage.receiver_id == current_user_id,
            ThreadMessage.is_read == False
        ).count()
        
        return jsonify({'unread_count': unread_count})
        
    except Exception as e:
        logger.error(f"Error in get_unread_count: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@messages_bp.route('/conversations', methods=['POST'])
@jwt_required()
def start_conversation():
    """Start a new conversation thread"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'participant_id' not in data:
            return jsonify({'error': 'Participant ID is required'}), 400
        
        participant_id = data['participant_id']
        current_user = User.query.get(current_user_id)
        participant = User.query.get(participant_id)
        
        if not participant:
            return jsonify({'error': 'Participant not found'}), 404
        
        # Determine patient and therapist based on roles
        if current_user.role == 'PATIENT' and participant.role == 'THERAPIST':
            patient_id = current_user_id
            therapist_id = participant_id
        elif current_user.role == 'THERAPIST' and participant.role == 'PATIENT':
            patient_id = participant_id
            therapist_id = current_user_id
        else:
            return jsonify({'error': 'Invalid participant combination'}), 400
        
        # Check for existing thread
        existing_thread = ConversationThread.query.filter(
            ConversationThread.patient_id == patient_id,
            ConversationThread.therapist_id == therapist_id
        ).first()
        
        if existing_thread:
            # If thread exists but was archived, unarchive it
            if current_user.role == 'PATIENT':
                existing_thread.patient_archived = False
            else:
                existing_thread.therapist_archived = False
                
            db.session.commit()
            return jsonify({'thread_id': existing_thread.id, 'message': 'Existing thread unarchived'}), 200
        
        # Create new thread
        thread = ConversationThread(
            patient_id=patient_id,
            therapist_id=therapist_id,
            session_id=data.get('session_id')
        )
        
        db.session.add(thread)
        db.session.commit()
        
        return jsonify({
            'thread_id': thread.id,
            'message': 'New conversation thread created'
        }), 201
        
    except Exception as e:
        logger.error(f"Error in start_conversation: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

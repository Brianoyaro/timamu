from flask import request, jsonify
from ..models import Message
from .. import db
messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/', methods=['GET'])
def list_messages():
    messages = Message.query.all()
    return jsonify([{'id': m.id, 'content': m.content, 'sender_id': m.sender_id} for m in messages])

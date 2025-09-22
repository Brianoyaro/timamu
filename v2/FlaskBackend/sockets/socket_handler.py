from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import current_app, request as flask_request
import jwt
from functools import wraps
from ..models import User, Session, Message
from .. import db
from datetime import datetime

socketio = None  # Will be initialized in app factory
active_connections = {} # Maps socket IDs to user IDs e.g { socketid1: userid1 }
active_rooms = {} # Maps room names to user IDs e.g { session_1: [userid1, userid2] }


def init_socketio(app):
    global socketio
    socketio = SocketIO(app, cors_allowed_origins="*")

    
    @socketio.on('connect')
    def handle_connect():
        '''Handle new socket connections.
        '''
        # JWT authentication should be handled here
        try:
            jwt_token = flask_request.args.get('token')
            if not jwt_token:
                emit('error', {'message': 'Authentication token required'})
                return
            decoded = jwt.decode(jwt_token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            user = User.query.get(decoded['user_id'])
            if not user or not user.is_active:
                emit('error', {'message': 'User not found or inactive'})
                return
            # Store user ID in active connections
            active_connections[flask_request.sid] = user.id

            # Join rooms
            join_room(f'user_{user.id}') # Join personal room
            join_room(f'role_{user.role}') # Join role-based room

            emit('connected', {'message': 'Connected to WebSocket server'})
            
            # emit online status to friends or contacts if needed
            emit('online_status', {'userId': user.id, 'status': 'online'})
        except Exception as e:
            emit('error', {'message': 'Invalid authentication token'})
            return


    @socketio.on('join_session')
    def join_session(data):
        '''Join a therapy session room.
        '''
        session_id = data.get('sessionId')
        room_name = f'session_{session_id}'
        join_room(room_name)
        # Add user to active_rooms, emit events as in Node.js
        if room_name not in active_rooms:
            active_rooms[room_name] = [] # Initialize room list
        if active_connections.get(flask_request.sid) not in active_rooms[room_name]:
            active_rooms[room_name].append(active_connections.get(flask_request.sid)) # Add user to room list
        emit('session_joined', {'sessionId': session_id})

    
    @socketio.on('leave_session')
    def leave_session(data):
        '''Leave a therapy session room.
        '''
        session_id = data.get('sessionId')
        room_name = f'session_{session_id}'
        leave_room(room_name)
        emit('session_left', {'sessionId': session_id})

    
    @socketio.on('webrtc_offer')
    def webrtc_offer(data):
        '''Handle WebRTC offer signaling.
        '''
        target_user_id = data.get('targetUserId')
        emit('webrtc_offer', data, room=f'user_{target_user_id}')

    
    @socketio.on('webrtc_answer')
    def webrtc_answer(data):
        '''Handle WebRTC answer signaling.
        '''
        target_user_id = data.get('targetUserId')
        emit('webrtc_answer', data, room=f'user_{target_user_id}')

    
    @socketio.on('webrtc_ice_candidate')
    def webrtc_ice_candidate(data):
        '''Handle WebRTC ICE candidate signaling.
        '''
        target_user_id = data.get('targetUserId')
        emit('webrtc_ice_candidate', data, room=f'user_{target_user_id}')


    @socketio.on('send_message')
    def send_message(data):
        '''Send a message to a specific user.
        '''
        receiver_id = data.get('receiverId')
        emit('new_message', data, room=f'user_{receiver_id}')
        emit('message_sent', data)


    @socketio.on('typing_start')
    def typing_start(data):
        '''Notify that a user has started typing.
        '''
        receiver_id = data.get('receiverId')
        emit('user_typing', {'userId': receiver_id}, room=f'user_{receiver_id}')


    @socketio.on('typing_stop')
    def typing_stop(data):
        '''Notify that a user has stopped typing.
        '''
        receiver_id = data.get('receiverId')
        emit('user_stopped_typing', {'userId': receiver_id}, room=f'user_{receiver_id}')


    @socketio.on('send_notification')
    def send_notification(data):
        '''Send a notification to a specific user.
        '''
        user_id = data.get('userId')
        emit('notification', data, room=f'user_{user_id}')
        emit('notification_sent', {'userId': user_id})


    @socketio.on('broadcast_to_role')
    def broadcast_to_role(data):
        '''Broadcast a message to all users with a specific role.
        '''
        role = data.get('role')
        emit('notification', data, room=f'role_{role}')
        emit('broadcast_sent', {'role': role})


    @socketio.on('get_online_users')
    def get_online_users():
        '''Get list of online users.
        '''
        emit('online_users', {'users': list(active_connections.values())})


    @socketio.on('disconnect')
    def handle_disconnect():
        '''Handle socket disconnections.
        '''
        # Remove user from active_connections and rooms
        user_id = active_connections.pop(flask_request.sid, None)
        if user_id:
            for room in active_rooms.values():
                if user_id in room:
                    room.remove(user_id)
                    break
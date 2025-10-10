from flask_socketio import emit, join_room, leave_room
from flask import current_app, request as flask_request
from flask_jwt_extended import decode_token, verify_jwt_in_request
import jwt
from functools import wraps
from ..models import User, Session, Message
from ..extensions import db, socketio
from datetime import datetime

active_connections = {} # Maps socket IDs to user IDs e.g { socketid1: userid1 }
active_rooms = {} # Maps room names to user IDs e.g { session_1: [userid1, userid2] }

def init_socketio():
    """Initialize SocketIO event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        '''Handle new socket connections.
        '''
        # JWT authentication using Flask-JWT-Extended
        try:
            jwt_token = flask_request.args.get('token')
            if not jwt_token:
                # Also check in auth header
                auth_header = flask_request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    jwt_token = auth_header.split(' ')[1]
                    
            if not jwt_token:
                emit('error', {'message': 'Authentication token required'})
                return False
                
            # Use Flask-JWT-Extended to decode the token
            try:
                decoded = decode_token(jwt_token)
                user_id = decoded['sub']  # Flask-JWT-Extended uses 'sub' for identity
                user = User.query.get(user_id)
                
                if not user or not user.is_active:
                    emit('error', {'message': 'User not found or inactive'})
                    return False
                    
            except Exception as decode_error:
                print(f"Token decode error: {decode_error}")
                emit('error', {'message': 'Invalid authentication token'})
                return False
                
            # Store user ID in active connections
            active_connections[flask_request.sid] = user.id

            # Join rooms
            join_room(f'user_{user.id}') # Join personal room
            join_room(f'role_{user.role}') # Join role-based room

            emit('connected', {'message': 'Connected to WebSocket server', 'userId': user.id})
            
            # emit online status to friends or contacts if needed
            emit('online_status', {'userId': user.id, 'status': 'online'}, broadcast=True)
            
            print(f"User {user.id} ({user.email}) connected via socket")
            return True
            
        except Exception as e:
            print(f"Socket connection error: {e}")
            emit('error', {'message': f'Socket connection failed: {str(e)}'})
            return False

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

    @socketio.on('join-video-room')
    def join_video_room(data):
        '''Join a video conference room'''
        room = data.get('room')
        session_id = data.get('sessionId')
        user_data = data.get('user')
        
        if not room or not user_data:
            emit('error', {'message': 'Missing room or user data'})
            return
        
        join_room(room)
        
        # Add to active rooms tracking
        if room not in active_rooms:
            active_rooms[room] = []
        
        user_id = active_connections.get(flask_request.sid)
        if user_id and user_id not in active_rooms[room]:
            active_rooms[room].append(user_id)
        
        # Notify other participants that user joined
        emit('user-joined', {
            'user': user_data,
            'socketId': flask_request.sid
        }, room=room, include_self=False)
        
        # Send current participants to the new user
        emit('room-users', {
            'users': active_rooms.get(room, [])
        })
        
        print(f"User {user_data.get('name')} joined video room {room}")

    @socketio.on('leave-video-room')
    def leave_video_room(data):
        '''Leave a video conference room'''
        room = data.get('room')
        
        if not room:
            return
        
        leave_room(room)
        
        # Remove from active rooms
        user_id = active_connections.get(flask_request.sid)
        if room in active_rooms and user_id in active_rooms[room]:
            active_rooms[room].remove(user_id)
        
        # Notify other participants
        emit('user-left', {
            'userId': user_id,
            'socketId': flask_request.sid
        }, room=room)
        
        print(f"User {user_id} left video room {room}")

    @socketio.on('offer')
    def handle_offer(data):
        '''Handle WebRTC offer for video calls'''
        room = data.get('room')
        offer = data.get('offer')
        
        if not room or not offer:
            emit('error', {'message': 'Missing room or offer data'})
            return
        
        # Broadcast offer to other participants in the room
        emit('offer', {
            'offer': offer,
            'from': flask_request.sid
        }, room=room, include_self=False)

    @socketio.on('answer')
    def handle_answer(data):
        '''Handle WebRTC answer for video calls'''
        room = data.get('room')
        answer = data.get('answer')
        
        if not room or not answer:
            emit('error', {'message': 'Missing room or answer data'})
            return
        
        # Broadcast answer to other participants in the room
        emit('answer', {
            'answer': answer,
            'from': flask_request.sid
        }, room=room, include_self=False)

    @socketio.on('ice-candidate')
    def handle_ice_candidate(data):
        '''Handle WebRTC ICE candidate for video calls'''
        room = data.get('room')
        candidate = data.get('candidate')
        
        if not room or not candidate:
            emit('error', {'message': 'Missing room or candidate data'})
            return
        
        # Broadcast ICE candidate to other participants in the room
        emit('ice-candidate', {
            'candidate': candidate,
            'from': flask_request.sid
        }, room=room, include_self=False)

    @socketio.on('session-message')
    def handle_session_message(data):
        '''Handle chat messages during video sessions'''
        room = data.get('room')
        session_id = data.get('sessionId')
        message = data.get('message')
        sender = data.get('sender')
        
        if not room or not message or not sender:
            emit('error', {'message': 'Missing message data'})
            return
        
        # Save message to database
        try:
            from ..models import SessionMessage
            session_message = SessionMessage(
                session_id=session_id,
                sender_id=sender['id'],
                message=message,
                message_type='text'
            )
            db.session.add(session_message)
            db.session.commit()
        except Exception as e:
            print(f"Error saving session message: {e}")
        
        # Broadcast message to all participants in the room
        emit('session-message', {
            'id': session_message.id if 'session_message' in locals() else None,
            'message': message,
            'sender': sender,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room)

    @socketio.on('participant-update')
    def handle_participant_update(data):
        '''Handle participant status updates (video/audio/screen share)'''
        room = data.get('room')
        updates = data.get('updates')
        
        if not room or not updates:
            emit('error', {'message': 'Missing update data'})
            return
        
        user_id = active_connections.get(flask_request.sid)
        
        # Broadcast updates to other participants
        emit('participant-update', {
            'userId': user_id,
            'socketId': flask_request.sid,
            'updates': updates
        }, room=room, include_self=False)

    # irrlevant code starting here
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

    # irrlevant code ends here probably
    @socketio.on('disconnect')
    def handle_disconnect():
        '''Handle socket disconnections.
        '''
        # Remove user from active_connections and rooms
        user_id = active_connections.pop(flask_request.sid, None)
        if user_id:
            # Remove from all active rooms and notify other participants
            for room_name, users in active_rooms.items():
                if user_id in users:
                    users.remove(user_id)
                    
                    # If this is a video room, notify other participants
                    if room_name.startswith('session_') and len(room_name.split('_')) == 2:
                        emit('user-left', {
                            'userId': user_id,
                            'socketId': flask_request.sid
                        }, room=room_name)
            
            # Emit offline status
            emit('online_status', {'userId': user_id, 'status': 'offline'}, broadcast=True)
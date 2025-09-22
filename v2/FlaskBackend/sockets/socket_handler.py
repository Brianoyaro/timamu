from flask_socketio import SocketIO, emit, join_room, leave_room

socketio = None  # Will be initialized in app factory

def init_socketio(app):
    global socketio
    socketio = SocketIO(app, cors_allowed_origins="*")

    @socketio.on('join')
    def handle_join(data):
        room = data.get('room')
        join_room(room)
        emit('joined', {'room': room}, room=room)

    @socketio.on('leave')
    def handle_leave(data):
        room = data.get('room')
        leave_room(room)
        emit('left', {'room': room}, room=room)

    @socketio.on('signal')
    def handle_signal(data):
        room = data.get('room')
        signal_data = data.get('signal')
        emit('signal', {'signal': signal_data}, room=room)

    # Add more events as needed for WebRTC signaling

import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const SOCKET_SERVER = 'http://localhost:5000';

let peerConnection;
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function VideoRoom() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef();
  const { roomId } = useParams();

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localVideoRef.current.srcObject = stream;

        socketRef.current.emit('join-room', roomId);

        socketRef.current.on('user-joined', async (remoteSocketId) => {
          peerConnection = new RTCPeerConnection(config);
          stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit('ice-candidate', {
                room: roomId,
                candidate: event.candidate,
                sender: socketRef.current.id
              });
            }
          };

          peerConnection.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
          };

          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          socketRef.current.emit('offer', {
            room: roomId,
            offer,
            sender: socketRef.current.id
          });
        });

        socketRef.current.on('offer', async (offer, sender) => {
          peerConnection = new RTCPeerConnection(config);
          stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit('ice-candidate', {
                room: roomId,
                candidate: event.candidate,
                sender: socketRef.current.id
              });
            }
          };

          peerConnection.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
          };

          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          socketRef.current.emit('answer', {
            room: roomId,
            answer,
            sender: socketRef.current.id
          });
        });

        socketRef.current.on('answer', async (answer, sender) => {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socketRef.current.on('ice-candidate', async (candidate, sender) => {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
      });
  }, [roomId]);

  return (
    <div>
      <h2>Video Room: {roomId}</h2>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '50%' }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '50%' }} />
      </div>
    </div>
  );
}

export default VideoRoom;


/**
 * Socket.IO Handler for Real-Time Collaborative Coding, WebRTC Signaling, and Interview Room State
 */
export const setupInterviewSocket = (io) => {
  // Store room state in-memory
  const roomState = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join Interview Room
    socket.on('join-room', ({ roomId, user }) => {
      socket.join(roomId);

      if (!roomState.has(roomId)) {
        roomState.set(roomId, {
          code: '// Select a language and start coding...',
          language: 'javascript',
          participants: new Map(),
          timerSeconds: 45 * 60,
        });
      }

      const room = roomState.get(roomId);
      const participantInfo = {
        socketId: socket.id,
        user: user || { name: 'Anonymous Candidate', role: 'candidate' },
        joinedAt: new Date(),
      };
      room.participants.set(socket.id, participantInfo);

      // Send existing room code state to newly joined user
      socket.emit('room-state-init', {
        code: room.code,
        language: room.language,
        participants: Array.from(room.participants.values()),
        timerSeconds: room.timerSeconds,
      });

      // Broadcast new participant arrival to room
      socket.to(roomId).emit('user-joined-room', {
        participant: participantInfo,
        participants: Array.from(room.participants.values()),
      });

      console.log(`[Socket.IO] User ${user?.name || socket.id} joined room ${roomId}`);
    });

    // Real-Time Collaborative Code Sync
    socket.on('code-change', ({ roomId, code, language }) => {
      const room = roomState.get(roomId);
      if (room) {
        room.code = code;
        if (language) room.language = language;
      }
      // Broadcast change to other peers in room
      socket.to(roomId).emit('code-update', { code, language, updatedBy: socket.id });
    });

    // Language Change Sync
    socket.on('language-change', ({ roomId, language }) => {
      const room = roomState.get(roomId);
      if (room) room.language = language;
      socket.to(roomId).emit('language-update', { language });
    });

    // Cursor Movement & Selection Sync
    socket.on('cursor-move', ({ roomId, cursorPosition, user }) => {
      socket.to(roomId).emit('cursor-update', {
        socketId: socket.id,
        cursorPosition,
        user,
      });
    });

    // Live Room Chat Messages
    socket.on('send-chat-message', ({ roomId, message, user, messageId }) => {
      const chatPayload = {
        id: messageId || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        text: message,
        sender: user?.name || 'Anonymous',
        role: user?.role || 'candidate',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      io.to(roomId).emit('new-chat-message', chatPayload);
    });

    // WebRTC Signaling: Offer
    socket.on('webrtc-offer', ({ roomId, offer, targetSocketId }) => {
      socket.to(roomId).emit('webrtc-offer-received', {
        offer,
        senderSocketId: socket.id,
      });
    });

    // WebRTC Signaling: Answer
    socket.on('webrtc-answer', ({ roomId, answer, targetSocketId }) => {
      socket.to(roomId).emit('webrtc-answer-received', {
        answer,
        senderSocketId: socket.id,
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('webrtc-ice-candidate-received', {
        candidate,
        senderSocketId: socket.id,
      });
    });

    // Disconnect Handler
    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id && roomState.has(roomId)) {
          const room = roomState.get(roomId);
          const leavingUser = room.participants.get(socket.id);
          room.participants.delete(socket.id);

          socket.to(roomId).emit('user-left-room', {
            socketId: socket.id,
            user: leavingUser?.user,
            participants: Array.from(room.participants.values()),
          });

          if (room.participants.size === 0) {
            roomState.delete(roomId);
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

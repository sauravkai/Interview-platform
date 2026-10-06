import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  Shield,
  PhoneOff,
  User,
  Volume2,
  Sparkles,
  Maximize2,
  Grid,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const WebRTCVideoCall = ({
  candidateName = '',
  interviewerName = '',
  candidateTitle = '',
  interviewerTitle = '',
  viewerRole = 'candidate',
  roomId = '',
  onEndInterview,
}) => {
  const { socket } = useSocket();
  const normalizedViewerRole = String(viewerRole || '').trim().toLowerCase();
  const isViewerInterviewer = normalizedViewerRole === 'interviewer';

  const displayCandidateName = candidateName || 'Candidate';
  const displayInterviewerName = interviewerName || 'Interviewer';
  const displayCandidateTitle = candidateTitle || 'Candidate';
  const displayInterviewerTitle = interviewerTitle || 'Senior Interviewer';
  const localLabelName = isViewerInterviewer ? displayInterviewerName : displayCandidateName;
  const localLabelTitle = isViewerInterviewer ? displayInterviewerTitle : displayCandidateTitle;
  const remoteLabelName = isViewerInterviewer ? displayCandidateName : displayInterviewerName;
  const remoteLabelTitle = isViewerInterviewer ? displayCandidateTitle : displayInterviewerTitle;
  const localRoleLabel = isViewerInterviewer ? 'Interviewer' : 'Candidate';
  const remoteRoleLabel = isViewerInterviewer ? 'Candidate' : 'Interviewer';

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [layoutMode, setLayoutMode] = useState('stacked'); // 'stacked' | 'grid'

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // WebRTC ICE Servers configuration
  const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  useEffect(() => {
    // 1. Request local media stream
    async function setupLocalMedia() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        mediaStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (_err) {
        setHasCameraPermission(false);
      }
    }

    setupLocalMedia();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // 2. WebRTC Peer Connection via Socket.IO
  useEffect(() => {
    if (!socket || !roomId) return;

    const createPeerConnection = () => {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, mediaStreamRef.current);
        });
      }

      // Receive remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsPeerConnected(true);
        }
      };

      // Send ICE candidates to remote peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', { roomId, candidate: event.candidate });
        }
      };

      return pc;
    };

    socket.on('user-joined-room', async () => {
      const pc = createPeerConnection();
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { roomId, offer });
      } catch (err) {
        console.warn('WebRTC offer creation error:', err);
      }
    });

    socket.on('webrtc-offer-received', async ({ offer }) => {
      const pc = peerConnectionRef.current || createPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { roomId, answer });
        setIsPeerConnected(true);
      } catch (err) {
        console.warn('WebRTC answer creation error:', err);
      }
    });

    socket.on('webrtc-answer-received', async ({ answer }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setIsPeerConnected(true);
        } catch (err) {
          console.warn('WebRTC remote description error:', err);
        }
      }
    });

    socket.on('webrtc-ice-candidate-received', async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('WebRTC ICE candidate error:', err);
        }
      }
    });

    return () => {
      socket.off('user-joined-room');
      socket.off('webrtc-offer-received');
      socket.off('webrtc-answer-received');
      socket.off('webrtc-ice-candidate-received');
    };
  }, [socket, roomId]);

  // Audio wave pulse animation simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking((prev) => !prev);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioMuted;
      }
    }
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
      }
    }
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } else {
        if (localVideoRef.current && mediaStreamRef.current) {
          localVideoRef.current.srcObject = mediaStreamRef.current;
        }
        setIsScreenSharing(false);
      }
    } catch (e) {
      console.warn('Screen sharing cancelled or unavailable.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Header Status Bar */}
      <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-200 truncate">WebRTC HD Stream</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {isPeerConnected ? 'P2P Active' : 'Room Connected'}
          </span>
          <button
            onClick={() => setLayoutMode((prev) => (prev === 'stacked' ? 'grid' : 'stacked'))}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Toggle Video Layout"
          >
            {layoutMode === 'stacked' ? <Grid className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Video Container (Responsive Stacked / Grid) */}
      <div className={`flex-1 p-2 gap-2 overflow-y-auto bg-slate-950 min-h-0 ${
        layoutMode === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'
      }`}>
        {/* Remote Video Feed (Interviewer / Peer) */}
        <div className="relative flex-1 min-h-[150px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-950 border border-slate-800 flex items-center justify-center group">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${isPeerConnected ? 'block' : 'hidden'}`}
          />

          {!isPeerConnected && (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full bg-purple-600/30 border-2 border-purple-500/50 flex items-center justify-center shadow-lg shadow-purple-500/20 ${
                  isSpeaking ? 'ring-4 ring-purple-500/30 animate-pulse' : ''
                }`}>
                  <User className="w-8 h-8 text-purple-200" />
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-100">{remoteLabelName}</h4>
                <p className="text-[10px] text-emerald-400 font-mono flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> {remoteRoleLabel}
                </p>
              </div>

              {/* Animated Audio Waveform Indicator */}
              <div className="flex items-center gap-0.5 h-3 mt-1">
                {[40, 70, 100, 60, 30, 80, 50].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${isSpeaking ? h : 20}%` }}
                    className="w-0.5 bg-purple-400/80 rounded-full transition-all duration-300"
                  ></span>
                ))}
              </div>
            </div>
          )}

          {/* Name & Audio Status Overlay */}
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800/80 text-[10px] font-mono text-slate-200 shadow-md">
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="font-semibold">{remoteLabelName}</span>
            </div>
            <div className="text-[9px] text-slate-300 mt-0.5">{remoteRoleLabel} • {remoteLabelTitle}</div>
          </div>
        </div>

        {/* Local Video Feed (Candidate) */}
        <div className="relative flex-1 min-h-[150px] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center group">
          {!isVideoOff && hasCameraPermission ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center">
                <User className="w-8 h-8 text-indigo-300" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-200">{localLabelName} {normalizedViewerRole === 'candidate' ? '(You)' : ''}</h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {localRoleLabel} • {localLabelTitle} • {isVideoOff ? 'Camera Turned Off' : 'Camera Stream Ready'}
                </p>
              </div>
            </div>
          )}

          {/* Name Overlay */}
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800/80 text-[10px] font-mono text-slate-200 shadow-md">
            <div className="flex items-center gap-1.5">
              {isAudioMuted ? (
                <MicOff className="w-3 h-3 text-rose-400" />
              ) : (
                <Mic className="w-3 h-3 text-emerald-400" />
              )}
              <span className="font-semibold">{localLabelName}</span>
            </div>
            <div className="text-[9px] text-slate-300 mt-0.5">{localRoleLabel} • {localLabelTitle}</div>
          </div>
        </div>
      </div>

      {/* Control Action Bar */}
      <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-xl border transition-all ${
              isAudioMuted
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-md shadow-rose-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-2 rounded-xl border transition-all ${
              isVideoOff
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-md shadow-rose-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-2 rounded-xl border transition-all ${
              isScreenSharing
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title="Share Screen"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        {onEndInterview && (
          <button
            onClick={onEndInterview}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 transition-all transform hover:scale-[1.02]"
          >
            <PhoneOff className="w-3.5 h-3.5" /> End Call
          </button>
        )}
      </div>
    </div>
  );
};


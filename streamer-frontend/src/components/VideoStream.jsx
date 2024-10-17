// src/components/VideoStream.jsx
import React, { useRef, useState } from 'react';
import axios from 'axios';

const VideoStream = () => {
  const videoRef = useRef(null);
  const [streamStarted, setStreamStarted] = useState(false);
  const [peer, setPeer] = useState(null); // Store peer connection

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.stunprotocol.org',
        },
      ],
    });

    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);
    return peer;
  };

  const handleNegotiationNeededEvent = async (peer) => {
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const payload = {
        sdp: peer.localDescription,
      };

      const { data } = await axios.post('http://192.168.137.1:3000/broadcast', payload);
      const desc = new RTCSessionDescription(data.sdp);
      await peer.setRemoteDescription(desc);
    } catch (error) {
      console.error('Error during negotiation: ', error);
    }
  };

  const init = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const peerConnection = createPeer();
      setPeer(peerConnection); // Set the peer connection

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      console.log('Stream is:', stream);
      setStreamStarted(true);

      // Start tracking latency every second
      setInterval(() => trackLatency(peerConnection), 1000);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const trackLatency = async (peerConnection) => {
    try {
      const stats = await peerConnection.getStats();
      stats.forEach(report => {
        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          const sendTimestamp = report.timestamp;
          const framesSent = report.framesSent;
          console.log(`Frames sent: ${framesSent} at ${sendTimestamp} ms`);

          // You can also log other relevant metrics if needed
        }
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          const receiveTimestamp = report.timestamp;
          const framesReceived = report.framesReceived;
          console.log(`Frames received: ${framesReceived} at ${receiveTimestamp} ms`);

          // Calculate latency (in milliseconds)
          const latency = receiveTimestamp - sendTimestamp; // Difference in timestamps
          console.log(`Estimated latency: ${latency} ms`);
        }
      });
    } catch (error) {
      console.error('Error getting stats: ', error);
    }
  };

  return (
    <div className="video-stream-container">
      <h1>Start Your Video Stream</h1>
      <div>
      <button onClick={init} disabled={streamStarted} className="stream-button">
        {streamStarted ? 'Streaming...' : 'Start Stream'}
      </button>
      </div>
      <video ref={videoRef} autoPlay className="video-element" width="600" height="400"></video>
    </div>
  );
};

export default VideoStream;

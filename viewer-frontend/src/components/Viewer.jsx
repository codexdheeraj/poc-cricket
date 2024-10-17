// src/components/Viewer.jsx
import React, { useRef, useState } from 'react';
import axios from 'axios';

const Viewer = () => {
  const videoRef = useRef(null);
  const [viewingStarted, setViewingStarted] = useState(false);
  const [peer, setPeer] = useState(null); // Store peer connection

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.stunprotocol.org',
        },
      ],
    });

    peer.addTransceiver('video', { direction: 'recvonly' });
    peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

    return peer;
  };

  const handleNegotiationNeededEvent = async (peer) => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
      sdp: peer.localDescription,
    };

    const { data } = await axios.post('http://192.168.137.1:3000/consumer', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch((e) => console.log(e));
  };

  const handleTrackEvent = (e) => {
    console.log('Handled Frame with event:', e);
    if (videoRef.current) {
      videoRef.current.srcObject = e.streams[0];
    }

    // Start tracking latency every second
    
  };

  const trackLatency = async (peer) => {
    // Check if the peer connection is initialized
    if (!peer) {
      console.error('Peer connection is not initialized');
      return;
    }

    try {
      const stats = await peer.getStats();
      // console.log("viewer stats", stats)
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          const receiveTimestamp = report.timestamp;
          const framesReceived = report.framesReceived;
          // console.log(`Frames received: ${framesReceived} at ${receiveTimestamp} ms`);
          console.log("viewer report", report)

          // You can log the send timestamp if you have that from the sender
          // For example, if you save the send timestamp when frames are sent
        }
      });
    } catch (error) {
      console.error('Error getting stats: ', error);
    }
  };

  const startViewing = () => {
    const peerConnection = createPeer();
    setPeer(peerConnection); // Set the peer connection
    setInterval(() => trackLatency(peerConnection), 1000);

    setViewingStarted(true);
  };

  return (
    <div className="viewer-container">
      <h1>Video Viewer</h1>
      <div>
      <button onClick={startViewing} disabled={viewingStarted} className="view-button">
        {viewingStarted ? 'Viewing...' : 'Start Viewing'}
      </button>
      </div>
      <video ref={videoRef} autoPlay width="600" height="400"></video>
    </div>
  );
};

export default Viewer;

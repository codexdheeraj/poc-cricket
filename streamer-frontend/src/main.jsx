// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import VideoStream from './components/VideoStream';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VideoStream />
  </React.StrictMode>
);

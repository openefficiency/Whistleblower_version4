import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaPlay, FaTrash } from 'react-icons/fa';

const VoiceRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(new Audio());
  
  useEffect(() => {
    // Clean up audio and timer on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  const startRecording = async (e) => {
    // Prevent form submission
    e.preventDefault();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        onRecordingComplete(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please ensure permissions are granted.');
    }
  };
  
  const stopRecording = (e) => {
    // Prevent form submission
    e.preventDefault();
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };
  
  const playRecording = (e) => {
    // Prevent form submission
    e.preventDefault();
    
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      
      setIsPlaying(true);
      audioRef.current.play();
    }
  };
  
  const stopPlayback = (e) => {
    // Prevent form submission
    e.preventDefault();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };
  
  const deleteRecording = (e) => {
    // Prevent form submission
    e.preventDefault();
    
    setAudioBlob(null);
    onRecordingComplete(null);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    setIsPlaying(false);
  };
  
  return (
    <div className="voice-recorder">
      {!audioBlob ? (
        <div className="recorder-controls">
          <button 
            type="button" // Important! Prevent form submission
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <FaStop /> : <FaMicrophone />}
          </button>
          
          {isRecording && (
            <div className="recording-time">
              <span className="recording-indicator"></span>
              {formatTime(recordingTime)}
            </div>
          )}
        </div>
      ) : (
        <div className="recording-playback">
          <div className="recording-info">
            <span className="recording-duration">
              Voice note recorded ({formatTime(recordingTime)})
            </span>
            
            <div className="playback-controls">
              <button 
                type="button" // Important! Prevent form submission
                className="playback-button"
                onClick={isPlaying ? stopPlayback : playRecording}
              >
                {isPlaying ? <FaStop /> : <FaPlay />}
              </button>
              
              <button 
                type="button" // Important! Prevent form submission
                className="delete-button"
                onClick={deleteRecording}
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;

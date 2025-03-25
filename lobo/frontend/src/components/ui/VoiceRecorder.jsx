import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, StopCircle } from 'lucide-react';
import { Button } from './button';
import { toast } from 'react-toastify';

const VoiceRecorder = ({ onTranscription, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  // Update timer display while recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startRecording(stream);
      setPermissionDenied(false);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setPermissionDenied(true);
      toast.error('Microphone access denied. Please enable microphone permissions.');
    }
  };
  
  const startRecording = (stream) => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const audioData = new Blob(chunksRef.current, { type: 'audio/webm' });
      setAudioBlob(audioData);
      
      // Clean up stream tracks
      stream.getTracks().forEach(track => track.stop());
    };
    
    // Start recording
    mediaRecorder.start();
    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };
  
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await requestPermission();
    }
  };
  
  const processAudio = async () => {
    if (!audioBlob) {
      toast.error('No recording to process');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real implementation, you would send the audio to a speech-to-text API
      // For this example, we'll simulate the process with a delay
      
      // Create a FormData object to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Simulate sending to an API with a delay
      setTimeout(() => {
        // For demo purposes, we'll just provide a placeholder transcription
        const mockTranscription = "This is a simulated transcription of the voice message.";
        onTranscription(mockTranscription);
        
        // Reset the recorder state
        setAudioBlob(null);
        setRecordingTime(0);
        setIsProcessing(false);
        
        toast.success('Voice message processed!');
      }, 1500);
      
      /* In a real implementation, you would do:
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Transcription failed');
      
      const data = await response.json();
      onTranscription(data.transcription);
      */
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process voice message');
      setIsProcessing(false);
    }
  };
  
  if (permissionDenied) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <MicOff size={18} />
        <span className="text-sm">Microphone access denied</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      {audioBlob && !isRecording ? (
        <>
          <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 w-32" />
          <Button
            variant="primary"
            size="sm"
            onClick={processAudio}
            disabled={isProcessing}
            className="ml-2"
          >
            {isProcessing ? 'Processing...' : 'Use Recording'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAudioBlob(null);
              setRecordingTime(0);
            }}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={toggleRecording}
            disabled={disabled || isProcessing}
            className="flex items-center gap-1"
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <>
                <StopCircle size={16} />
                <span>{formatTime(recordingTime)}</span>
              </>
            ) : (
              <>
                <Mic size={16} />
                <span>Record</span>
              </>
            )}
          </Button>
          
          {isRecording && (
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </>
      )}
    </div>
  );
};

export default VoiceRecorder;
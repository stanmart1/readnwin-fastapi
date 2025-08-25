'use client';

import { useState, useEffect, useRef } from 'react';

interface TextToSpeechProps {
  text: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  className?: string;
}

interface Voice extends SpeechSynthesisVoice {
  name: string;
  lang: string;
  voiceURI: string;
}

export default function TextToSpeech({ 
  text, 
  isPlaying, 
  onPlay, 
  onPause, 
  onStop, 
  className = '' 
}: TextToSpeechProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSupported, setIsSupported] = useState(false);
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      synthesisRef.current = window.speechSynthesis;
      
      // Load available voices
      const loadVoices = () => {
        const availableVoices = synthesisRef.current?.getVoices() || [];
        setVoices(availableVoices);
        
        // Set default voice (prefer English)
        const defaultVoice = availableVoices.find(voice => 
          voice.lang.startsWith('en') && voice.name.includes('Female')
        ) || availableVoices.find(voice => 
          voice.lang.startsWith('en')
        ) || availableVoices[0];
        
        setSelectedVoice(defaultVoice || null);
      };

      // Load voices when they become available
      if (synthesisRef.current.getVoices().length > 0) {
        loadVoices();
      } else {
        synthesisRef.current.addEventListener('voiceschanged', loadVoices);
      }

      return () => {
        synthesisRef.current?.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  useEffect(() => {
    if (!isSupported || !synthesisRef.current) return;

    // Create speech utterance
    speechRef.current = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice) {
      speechRef.current.voice = selectedVoice;
    }
    
    speechRef.current.rate = rate;
    speechRef.current.pitch = pitch;
    speechRef.current.volume = volume;

    // Event handlers
    speechRef.current.onstart = () => {
      onPlay();
    };

    speechRef.current.onend = () => {
      onStop();
    };

    speechRef.current.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      onStop();
    };

    return () => {
      if (speechRef.current) {
        speechRef.current.onstart = null;
        speechRef.current.onend = null;
        speechRef.current.onerror = null;
      }
    };
  }, [text, selectedVoice, rate, pitch, volume, isSupported, onPlay, onStop]);

  const handlePlay = () => {
    if (!isSupported || !synthesisRef.current || !speechRef.current) return;
    
    if (isPlaying) {
      synthesisRef.current.pause();
      onPause();
    } else {
      synthesisRef.current.resume();
      onPlay();
    }
  };

  const handleStop = () => {
    if (!isSupported || !synthesisRef.current) return;
    
    synthesisRef.current.cancel();
    onStop();
  };

  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <i className="ri-volume-mute-line mr-2"></i>
        Text-to-speech not supported in this browser
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Play/Pause Button */}
      <button
        onClick={handlePlay}
        disabled={!text.trim()}
        className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        <i className={`text-sm ${isPlaying ? 'ri-pause-line' : 'ri-play-line'}`}></i>
      </button>

      {/* Stop Button */}
      <button
        onClick={handleStop}
        disabled={!isPlaying}
        className="p-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Stop"
      >
        <i className="ri-stop-line text-sm"></i>
      </button>

      {/* Voice Selection */}
      <select
        value={selectedVoice?.voiceURI || ''}
        onChange={(e) => {
          const voice = voices.find(v => v.voiceURI === e.target.value);
          setSelectedVoice(voice || null);
        }}
        className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {voices.map((voice) => (
          <option key={voice.voiceURI} value={voice.voiceURI}>
            {voice.name} ({voice.lang})
          </option>
        ))}
      </select>

      {/* Speed Control */}
      <div className="flex items-center space-x-1">
        <span className="text-xs text-gray-600">Speed:</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-gray-600 w-8">{rate}x</span>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-1">
        <i className="ri-volume-up-line text-sm text-gray-600"></i>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
} 
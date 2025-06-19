import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FaMicrophone, FaPaperPlane, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import SecondNavbar from '../Navbar/SecondNavbar';
import { Player } from '@lottiefiles/react-lottie-player';
import womanAvatar from '../../assets/talking-avatar-w.json';
import manAvatar from '../../assets/talking-avatar-m.json';
import robotAvatar from '../../assets/talking-avatar-r.json';
import { chatWithAvatar, chatWithAvatarAudio } from '../../services/student-api.js';
import { getStudentInformationByStudentId } from '../../services/user-api';
import HamsterWheel from '../Spinner/HamsterWheel.jsx';
import './AvatarChat.css';

const AvatarChat = () => {
  const { studentId } = useParams();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true); // New state for page loading
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnable, setVoiceEnable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarAnimation, setAvatarAnimation] = useState(robotAvatar);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const lottieRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        setIsPageLoading(true); // Set page loading to true
        const studentInfo = await getStudentInformationByStudentId(studentId);

        switch (studentInfo.avatarChatType) {
          case 1:
            setAvatarAnimation(womanAvatar);
            break;
          case 2:
            setAvatarAnimation(manAvatar);
            break;
          case 0:
          default:
            setAvatarAnimation(robotAvatar);
            break;
        }
      } catch (error) {
        console.error('Error fetching student information:', error);
        setMessages((prev) => [...prev, { content: 'Failed to load student information.', isUser: false }]);
        setAvatarAnimation(robotAvatar);
      } finally {
        setIsPageLoading(false); // Set page loading to false when done
      }
    };

    fetchStudentInfo();
  }, [studentId]);

  useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking) {
        lottieRef.current.play();
      } else {
        lottieRef.current.pause();
      }
    }
  }, [isSpeaking]);

  useEffect(() => {
    // Cleanup audio when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const base64ToBlob = (base64, type = 'audio/mpeg') => {
    try {
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      return new Blob([array], { type });
    } catch (error) {
      console.error('Base64 conversion error:', error);
      return null;
    }
  };

  const playAudio = (audioData) => {
    console.log('Audio data type:', typeof audioData, 'Data:', audioData.slice(0, 50));

    if (!audioData) {
      console.error('Audio data is empty or null.');
      setMessages((prev) => [...prev, { content: 'Audio playback failed: Missing data.', isUser: false }]);
      return;
    }

    let audioBlob;
    if (typeof audioData === 'string') {
      audioBlob = base64ToBlob(audioData);
      if (!audioBlob) {
        setMessages((prev) => [...prev, { content: 'Audio playback failed: Invalid data format.', isUser: false }]);
        return;
      }
    } else if (audioData instanceof ArrayBuffer || Array.isArray(audioData)) {
      audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
    } else {
      console.error('Invalid audio data format:', audioData);
      setMessages((prev) => [...prev, { content: 'Audio playback failed: Unknown data format.', isUser: false }]);
      return;
    }

    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio; // Store audio element in ref
      setIsSpeaking(true);
      audio.play().catch((error) => {
        console.error('Audio playback error:', error);
        setMessages((prev) => [...prev, { content: 'Audio playback failed: Browser error.', isUser: false }]);
        setIsSpeaking(false);
      });
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null; // Clear ref when audio ends
      };
    } catch (error) {
      console.error('Audio processing error:', error);
      setMessages((prev) => [...prev, { content: 'An error occurred while processing audio.', isUser: false }]);
      setIsSpeaking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const userMessage = { content: messageInput, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setMessageInput('');

    try {
      setIsLoading(true);
      const response = await chatWithAvatar(studentId, messageInput, voiceEnable);
      console.log('Response:', response);
      const botMessage = { content: response.response, isUser: false };
      setMessages((prev) => [...prev, botMessage]);

      if (response.audio && voiceEnable) {
        playAudio(response.audio);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { content: 'An error occurred, please try again.', isUser: false };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = handleAudio;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      setMessages((prev) => [...prev, { content: 'Microphone access denied.', isUser: false }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudio = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    audioChunksRef.current = [];

    try {
      setIsLoading(true);
      const response = await chatWithAvatarAudio(studentId, audioBlob);
      console.log('Audio Response:', response);

      const userMessage = {
        content: response.requestMessage && response.requestMessage.trim()
          ? response.requestMessage
          : 'Audio transcription failed.',
        isUser: true
      };
      setMessages((prev) => [...prev, userMessage]);

      const botMessage = { content: response.response, isUser: false };
      setMessages((prev) => [...prev, botMessage]);

      if (response.audio && voiceEnable) {
        playAudio(response.audio);
      }
    } catch (error) {
      console.error('Audio chat error:', error);
      const errorMessage = { content: 'An error occurred while processing audio.', isUser: false };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrophoneClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleVoice = () => {
    setVoiceEnable((prev) => !prev);
  };

  // Show loading screen if page is loading
  if (isPageLoading) {
    return (
      <div className="avatar-chat-fullpage-loading">
        <div className='avatar-chat-hamster-loading'>
          <HamsterWheel />
        </div>
        <p className="avatar-chat-loading-text">Avatar Loading...</p>
      </div>
    );
  }

  return (
    <div className="avatar-chat-all">
      <SecondNavbar
        visibleButtons={['testBank', 'lectures', 'avatar', 'profile', 'game', 'logout', 'exitChildPerspective']}
      />
      <div className="avatar-chat-container">
        <div className="avatar-section">
          {avatarAnimation ? (
            <Player
              ref={lottieRef}
              autoplay={false}
              loop
              src={avatarAnimation}
              style={{ height: 150, width: 150, borderRadius: '15px', border: '3px solid #ff9500' }}
              aria-label={isSpeaking ? 'Avatar is speaking' : 'Avatar is idle'}
            />
          ) : (
            <div className="avatar-placeholder">Loading avatar...</div>
          )}
        </div>
        <div className="avatar-chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.isUser ? 'user' : 'bot'}`}>
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="message-bubble bot loading">
              <span className="message-loading-text">thinks...</span>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="message-input-container">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading || isRecording}
          />
          <button type="submit" disabled={isLoading || isRecording} className="send-button">
            <FaPaperPlane />
          </button>
          <button
            type="button"
            className={`microphone-button ${isRecording ? 'recording' : ''}`}
            onClick={handleMicrophoneClick}
            disabled={isLoading}
          >
            <FaMicrophone />
          </button>
          <button
            type="button"
            className={`voice-toggle-button ${voiceEnable ? 'active' : ''}`}
            onClick={toggleVoice}
            title={voiceEnable ? 'Disable voice response' : 'Enable voice response'}
          >
            {voiceEnable ? <FaVolumeUp /> : <FaVolumeMute />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AvatarChat;
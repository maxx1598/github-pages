"""Voice recognition system using Vosk for offline speech recognition."""

import os
import json
import logging
import threading
import queue
import time
from typing import Optional, Callable
import pyaudio
import wave

# Try to import vosk, fall back gracefully
try:
    import vosk
    VOSK_AVAILABLE = True
except ImportError:
    VOSK_AVAILABLE = False
    vosk = None

logger = logging.getLogger(__name__)

class VoiceRecognition:
    """Offline voice recognition using Vosk."""
    
    def __init__(self, config):
        """Initialize voice recognition."""
        self.config = config
        self.model = None
        self.recognizer = None
        self.audio_queue = queue.Queue()
        
        # Audio settings
        self.sample_rate = 16000
        self.chunk_size = 1024
        self.audio_format = pyaudio.paInt16
        self.channels = 1
        
        # PyAudio
        self.audio = None
        self.stream = None
        
        # Callbacks
        self.wake_word_callback = None
        self.command_callback = None
        
        # State
        self.is_listening = False
        self.listening_for_command = False
        
        # Wake word detection
        self.wake_word = config.get('wake_word', 'hey jarvis').lower()
        self.wake_word_timeout = 2.0  # seconds of silence before stopping
        
        logger.info("Voice recognition initialized")
    
    def initialize(self):
        """Initialize voice recognition components."""
        if not VOSK_AVAILABLE:
            logger.warning("Vosk not available, voice recognition disabled")
            return False
        
        try:
            # Initialize PyAudio
            self.audio = pyaudio.PyAudio()
            
            # Load Vosk model
            model_path = self.config.get('vosk_model_path', 'models/vosk-model-en-us-0.22')
            
            if not os.path.exists(model_path):
                logger.warning(f"Vosk model not found at {model_path}")
                self._download_vosk_model(model_path)
            
            if os.path.exists(model_path):
                self.model = vosk.Model(model_path)
                self.recognizer = vosk.KaldiRecognizer(self.model, self.sample_rate)
                logger.info("Vosk model loaded successfully")
                return True
            else:
                logger.error("Could not load Vosk model")
                return False
        
        except Exception as e:
            logger.error(f"Error initializing voice recognition: {e}")
            return False
    
    def _download_vosk_model(self, model_path: str):
        """Download Vosk model if not present."""
        logger.info("Vosk model not found, attempting to download...")
        
        try:
            import zipfile
            import urllib.request
            from pathlib import Path
            
            # Create models directory
            models_dir = Path(model_path).parent
            models_dir.mkdir(exist_ok=True)
            
            # Download small English model
            model_url = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
            zip_path = models_dir / "vosk-model.zip"
            
            logger.info("Downloading Vosk model...")
            urllib.request.urlretrieve(model_url, zip_path)
            
            # Extract model
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(models_dir)
            
            # Rename extracted folder to expected name
            extracted_name = "vosk-model-small-en-us-0.15"
            extracted_path = models_dir / extracted_name
            if extracted_path.exists():
                extracted_path.rename(model_path)
            
            # Clean up
            zip_path.unlink()
            
            logger.info("Vosk model downloaded successfully")
            
        except Exception as e:
            logger.error(f"Error downloading Vosk model: {e}")
    
    def is_available(self) -> bool:
        """Check if voice recognition is available."""
        return VOSK_AVAILABLE and self.model is not None
    
    def set_wake_word_callback(self, callback: Callable):
        """Set callback for wake word detection."""
        self.wake_word_callback = callback
    
    def set_command_callback(self, callback: Callable):
        """Set callback for command recognition."""
        self.command_callback = callback
    
    def _start_audio_stream(self):
        """Start audio input stream."""
        try:
            self.stream = self.audio.open(
                format=self.audio_format,
                channels=self.channels,
                rate=self.sample_rate,
                input=True,
                frames_per_buffer=self.chunk_size,
                stream_callback=self._audio_callback
            )
            self.stream.start_stream()
            return True
        except Exception as e:
            logger.error(f"Error starting audio stream: {e}")
            return False
    
    def _stop_audio_stream(self):
        """Stop audio input stream."""
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
            self.stream = None
    
    def _audio_callback(self, in_data, frame_count, time_info, status):
        """Audio stream callback."""
        if self.is_listening:
            self.audio_queue.put(in_data)
        return (None, pyaudio.paContinue)
    
    def listen_for_wake_word(self):
        """Listen for wake word."""
        if not self.is_available():
            return
        
        try:
            # Start audio stream if not already started
            if not self.stream or not self.stream.is_active():
                if not self._start_audio_stream():
                    return
            
            # Process audio data
            if not self.audio_queue.empty():
                audio_data = self.audio_queue.get()
                
                if self.recognizer.AcceptWaveform(audio_data):
                    result = json.loads(self.recognizer.Result())
                    text = result.get('text', '').lower()
                    
                    if self.wake_word in text:
                        logger.info(f"Wake word detected: {text}")
                        if self.wake_word_callback:
                            self.wake_word_callback()
        
        except Exception as e:
            logger.error(f"Error in wake word detection: {e}")
    
    def listen_for_command(self, timeout: float = 5.0):
        """Listen for a command after wake word detection."""
        if not self.is_available():
            return
        
        self.listening_for_command = True
        command_text = ""
        start_time = time.time()
        silence_start = None
        
        try:
            while self.listening_for_command and (time.time() - start_time) < timeout:
                if not self.audio_queue.empty():
                    audio_data = self.audio_queue.get()
                    
                    if self.recognizer.AcceptWaveform(audio_data):
                        result = json.loads(self.recognizer.Result())
                        text = result.get('text', '').strip()
                        
                        if text:
                            command_text += " " + text
                            silence_start = None  # Reset silence timer
                        else:
                            if silence_start is None:
                                silence_start = time.time()
                            elif time.time() - silence_start > self.wake_word_timeout:
                                break  # End of command due to silence
                    else:
                        # Partial result
                        partial_result = json.loads(self.recognizer.PartialResult())
                        partial_text = partial_result.get('partial', '')
                        if partial_text:
                            silence_start = None
                
                time.sleep(0.01)  # Small delay
            
            # Get final result
            final_result = json.loads(self.recognizer.FinalResult())
            final_text = final_result.get('text', '').strip()
            if final_text:
                command_text += " " + final_text
            
            command_text = command_text.strip()
            
            if command_text and self.command_callback:
                logger.info(f"Command recognized: {command_text}")
                self.command_callback(command_text)
        
        except Exception as e:
            logger.error(f"Error in command recognition: {e}")
        
        finally:
            self.listening_for_command = False
    
    def start_continuous_listening(self):
        """Start continuous listening mode."""
        if self.is_available():
            self.is_listening = True
            self._start_audio_stream()
            logger.info("Started continuous listening")
    
    def stop_listening(self):
        """Stop listening."""
        self.is_listening = False
        self.listening_for_command = False
        self._stop_audio_stream()
        logger.info("Stopped listening")
    
    def update_config(self, config):
        """Update configuration."""
        self.config = config
        self.wake_word = config.get('wake_word', 'hey jarvis').lower()
    
    def get_audio_devices(self) -> list:
        """Get list of available audio input devices."""
        devices = []
        if self.audio:
            for i in range(self.audio.get_device_count()):
                info = self.audio.get_device_info_by_index(i)
                if info['maxInputChannels'] > 0:
                    devices.append({
                        'index': i,
                        'name': info['name'],
                        'channels': info['maxInputChannels'],
                        'sample_rate': int(info['defaultSampleRate'])
                    })
        return devices
    
    def test_microphone(self) -> bool:
        """Test if microphone is working."""
        try:
            test_stream = self.audio.open(
                format=self.audio_format,
                channels=self.channels,
                rate=self.sample_rate,
                input=True,
                frames_per_buffer=self.chunk_size
            )
            
            # Record for 1 second
            frames = []
            for _ in range(int(self.sample_rate / self.chunk_size)):
                data = test_stream.read(self.chunk_size)
                frames.append(data)
            
            test_stream.stop_stream()
            test_stream.close()
            
            # Check if we got audio data
            total_data = b''.join(frames)
            return len(total_data) > 0
        
        except Exception as e:
            logger.error(f"Microphone test failed: {e}")
            return False
    
    def cleanup(self):
        """Cleanup resources."""
        logger.info("Cleaning up voice recognition")
        
        self.stop_listening()
        
        if self.audio:
            self.audio.terminate()
            self.audio = None
        
        # Clear audio queue
        while not self.audio_queue.empty():
            try:
                self.audio_queue.get_nowait()
            except queue.Empty:
                break
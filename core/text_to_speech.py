"""Text-to-speech system using pyttsx3 for offline speech synthesis."""

import logging
import threading
import queue
import time
from typing import Optional, List

# Try to import pyttsx3, fall back gracefully
try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False
    pyttsx3 = None

logger = logging.getLogger(__name__)

class TextToSpeech:
    """Text-to-speech system using pyttsx3."""
    
    def __init__(self, config):
        """Initialize text-to-speech."""
        self.config = config
        self.engine = None
        self.is_speaking = False
        self.speech_queue = queue.Queue()
        self.speech_thread = None
        self.should_stop = False
        
        # Default settings
        self.rate = config.get('tts_rate', 150)
        self.volume = config.get('tts_volume', 0.8)
        self.voice_id = config.get('tts_voice', 'default')
        
        logger.info("Text-to-speech initialized")
    
    def initialize(self):
        """Initialize TTS engine."""
        if not PYTTSX3_AVAILABLE:
            logger.warning("pyttsx3 not available, TTS disabled")
            return False
        
        try:
            self.engine = pyttsx3.init()
            
            # Set properties
            self.engine.setProperty('rate', self.rate)
            self.engine.setProperty('volume', self.volume)
            
            # Set voice if specified
            if self.voice_id != 'default':
                voices = self.engine.getProperty('voices')
                for voice in voices:
                    if self.voice_id in voice.id or self.voice_id in voice.name:
                        self.engine.setProperty('voice', voice.id)
                        break
            
            # Start speech processing thread
            self.speech_thread = threading.Thread(target=self._speech_worker, daemon=True)
            self.speech_thread.start()
            
            logger.info("TTS engine initialized successfully")
            return True
        
        except Exception as e:
            logger.error(f"Error initializing TTS engine: {e}")
            return False
    
    def is_available(self) -> bool:
        """Check if TTS is available."""
        return PYTTSX3_AVAILABLE and self.engine is not None
    
    def speak(self, text: str, wait: bool = True, priority: bool = False):
        """Speak text."""
        if not self.is_available() or not text:
            return
        
        if not self.config.get('tts_enabled', True):
            return
        
        # Add to speech queue
        speech_item = {
            'text': text,
            'wait': wait,
            'priority': priority,
            'timestamp': time.time()
        }
        
        if priority:
            # Clear queue for priority messages
            while not self.speech_queue.empty():
                try:
                    self.speech_queue.get_nowait()
                except queue.Empty:
                    break
        
        self.speech_queue.put(speech_item)
        
        if wait:
            # Wait for speech to complete
            while self.is_speaking or not self.speech_queue.empty():
                time.sleep(0.1)
    
    def _speech_worker(self):
        """Worker thread for processing speech queue."""
        while not self.should_stop:
            try:
                if not self.speech_queue.empty():
                    item = self.speech_queue.get()
                    text = item['text']
                    
                    self.is_speaking = True
                    logger.info(f"Speaking: {text[:50]}...")
                    
                    # Use engine to speak
                    self.engine.say(text)
                    self.engine.runAndWait()
                    
                    self.is_speaking = False
                else:
                    time.sleep(0.1)
            
            except Exception as e:
                logger.error(f"Error in speech worker: {e}")
                self.is_speaking = False
                time.sleep(0.5)
    
    def stop(self):
        """Stop current speech and clear queue."""
        # Clear speech queue
        while not self.speech_queue.empty():
            try:
                self.speech_queue.get_nowait()
            except queue.Empty:
                break
        
        # Stop engine if speaking
        if self.engine and self.is_speaking:
            try:
                self.engine.stop()
            except:
                pass
        
        self.is_speaking = False
        logger.info("Speech stopped")
    
    def get_available_voices(self) -> List[dict]:
        """Get list of available voices."""
        voices = []
        if self.engine:
            try:
                engine_voices = self.engine.getProperty('voices')
                for voice in engine_voices:
                    voices.append({
                        'id': voice.id,
                        'name': voice.name,
                        'languages': getattr(voice, 'languages', []),
                        'gender': getattr(voice, 'gender', 'unknown'),
                        'age': getattr(voice, 'age', 'unknown')
                    })
            except Exception as e:
                logger.error(f"Error getting voices: {e}")
        
        return voices
    
    def set_voice(self, voice_id: str) -> bool:
        """Set voice by ID."""
        if not self.engine:
            return False
        
        try:
            voices = self.engine.getProperty('voices')
            for voice in voices:
                if voice_id in voice.id or voice_id in voice.name:
                    self.engine.setProperty('voice', voice.id)
                    self.voice_id = voice_id
                    logger.info(f"Voice set to: {voice.name}")
                    return True
            
            logger.warning(f"Voice not found: {voice_id}")
            return False
        
        except Exception as e:
            logger.error(f"Error setting voice: {e}")
            return False
    
    def set_rate(self, rate: int):
        """Set speech rate (words per minute)."""
        if self.engine:
            try:
                self.engine.setProperty('rate', rate)
                self.rate = rate
                logger.info(f"Speech rate set to: {rate}")
            except Exception as e:
                logger.error(f"Error setting speech rate: {e}")
    
    def set_volume(self, volume: float):
        """Set speech volume (0.0 to 1.0)."""
        if self.engine:
            try:
                volume = max(0.0, min(1.0, volume))  # Clamp to valid range
                self.engine.setProperty('volume', volume)
                self.volume = volume
                logger.info(f"Speech volume set to: {volume}")
            except Exception as e:
                logger.error(f"Error setting speech volume: {e}")
    
    def test_speech(self, text: str = "Hello, this is a test of the text to speech system."):
        """Test speech functionality."""
        if not self.is_available():
            return False
        
        try:
            self.speak(text, wait=True, priority=True)
            return True
        except Exception as e:
            logger.error(f"Speech test failed: {e}")
            return False
    
    def update_config(self, config):
        """Update configuration."""
        self.config = config
        
        # Update settings
        new_rate = config.get('tts_rate', 150)
        new_volume = config.get('tts_volume', 0.8)
        new_voice = config.get('tts_voice', 'default')
        
        if new_rate != self.rate:
            self.set_rate(new_rate)
        
        if new_volume != self.volume:
            self.set_volume(new_volume)
        
        if new_voice != self.voice_id:
            self.set_voice(new_voice)
    
    def save_to_file(self, text: str, filename: str) -> bool:
        """Save speech to audio file."""
        if not self.engine:
            return False
        
        try:
            self.engine.save_to_file(text, filename)
            self.engine.runAndWait()
            logger.info(f"Speech saved to: {filename}")
            return True
        except Exception as e:
            logger.error(f"Error saving speech to file: {e}")
            return False
    
    def get_status(self) -> dict:
        """Get TTS status."""
        return {
            'available': self.is_available(),
            'speaking': self.is_speaking,
            'queue_size': self.speech_queue.qsize(),
            'rate': self.rate,
            'volume': self.volume,
            'voice_id': self.voice_id,
            'enabled': self.config.get('tts_enabled', True)
        }
    
    def cleanup(self):
        """Cleanup resources."""
        logger.info("Cleaning up text-to-speech")
        
        self.should_stop = True
        self.stop()
        
        if self.speech_thread and self.speech_thread.is_alive():
            self.speech_thread.join(timeout=2.0)
        
        if self.engine:
            try:
                self.engine.stop()
            except:
                pass
            self.engine = None
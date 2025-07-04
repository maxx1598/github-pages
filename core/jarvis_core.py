"""Core JARVIS system that orchestrates all components."""

import threading
import time
import queue
import logging
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime

from .config import Config
from .security import SecurityManager
from .voice_recognition import VoiceRecognition
from .text_to_speech import TextToSpeech
from .plugin_manager import PluginManager
from .conversation_manager import ConversationManager

logger = logging.getLogger(__name__)

class JarvisCore:
    """Main JARVIS core system that orchestrates all components."""
    
    def __init__(self, config: Config, security_manager: SecurityManager):
        """Initialize JARVIS core system."""
        self.config = config
        self.security_manager = security_manager
        
        # Initialize components
        self.voice_recognition = VoiceRecognition(config)
        self.tts = TextToSpeech(config)
        self.plugin_manager = PluginManager(config, security_manager)
        self.conversation_manager = ConversationManager(config, security_manager)
        
        # System state
        self.is_listening = False
        self.is_processing = False
        self.is_speaking = False
        self.wake_word_detected = False
        
        # Threading
        self.voice_thread = None
        self.processing_queue = queue.Queue()
        self.response_callbacks = []
        
        # Statistics
        self.stats = {
            'commands_processed': 0,
            'wake_words_detected': 0,
            'errors': 0,
            'start_time': datetime.now()
        }
        
        logger.info("JARVIS Core initialized")
    
    def initialize(self):
        """Initialize all JARVIS components."""
        try:
            # Initialize voice recognition
            self.voice_recognition.initialize()
            
            # Initialize TTS
            self.tts.initialize()
            
            # Load plugins
            self.plugin_manager.load_plugins()
            
            # Load conversation history
            self.conversation_manager.initialize()
            
            # Set up callbacks
            self.voice_recognition.set_wake_word_callback(self._on_wake_word_detected)
            self.voice_recognition.set_command_callback(self._on_voice_command)
            
            logger.info("JARVIS Core fully initialized")
            
        except Exception as e:
            logger.error(f"Error initializing JARVIS Core: {e}")
            raise
    
    def start_voice_recognition(self):
        """Start voice recognition in a separate thread."""
        if not self.is_listening and self.voice_recognition.is_available():
            self.is_listening = True
            self.voice_thread = threading.Thread(target=self._voice_recognition_loop, daemon=True)
            self.voice_thread.start()
            logger.info("Voice recognition started")
    
    def stop_voice_recognition(self):
        """Stop voice recognition."""
        self.is_listening = False
        if self.voice_thread and self.voice_thread.is_alive():
            self.voice_thread.join(timeout=2.0)
        logger.info("Voice recognition stopped")
    
    def _voice_recognition_loop(self):
        """Main voice recognition loop."""
        while self.is_listening:
            try:
                self.voice_recognition.listen_for_wake_word()
                time.sleep(0.1)  # Small delay to prevent excessive CPU usage
            except Exception as e:
                logger.error(f"Error in voice recognition loop: {e}")
                self.stats['errors'] += 1
                time.sleep(1.0)  # Longer delay on error
    
    def _on_wake_word_detected(self):
        """Called when wake word is detected."""
        self.wake_word_detected = True
        self.stats['wake_words_detected'] += 1
        
        # Provide audio feedback
        self.tts.speak("Yes?", wait=False)
        
        # Listen for command
        self.voice_recognition.listen_for_command()
        
        logger.info("Wake word detected, listening for command")
    
    def _on_voice_command(self, command: str):
        """Called when a voice command is received."""
        if command:
            sanitized_command = self.security_manager.sanitize_input(command)
            self.process_command(sanitized_command, source="voice")
    
    def process_command(self, command: str, source: str = "text", callback: Optional[Callable] = None):
        """Process a command from any source."""
        if self.is_processing:
            self.tts.speak("I'm still processing the previous command. Please wait.")
            return
        
        self.is_processing = True
        self.stats['commands_processed'] += 1
        
        # Add to processing queue
        self.processing_queue.put({
            'command': command,
            'source': source,
            'timestamp': datetime.now(),
            'callback': callback
        })
        
        # Process in separate thread
        processing_thread = threading.Thread(target=self._process_command_worker, daemon=True)
        processing_thread.start()
    
    def _process_command_worker(self):
        """Worker thread for processing commands."""
        try:
            if not self.processing_queue.empty():
                item = self.processing_queue.get()
                command = item['command']
                source = item['source']
                callback = item.get('callback')
                
                logger.info(f"Processing command: {command[:50]}... (source: {source})")
                
                # Add to conversation history
                self.conversation_manager.add_user_message(command)
                
                # Process with plugin manager
                response = self.plugin_manager.process_command(command)
                
                if response:
                    # Add response to conversation history
                    self.conversation_manager.add_assistant_message(response)
                    
                    # Speak response if TTS is enabled
                    if self.config.get('tts_enabled', True) and source == "voice":
                        self.is_speaking = True
                        self.tts.speak(response)
                        self.is_speaking = False
                    
                    # Call callback if provided
                    if callback:
                        callback(response)
                    
                    # Notify UI callbacks
                    for cb in self.response_callbacks:
                        cb(command, response, source)
                    
                    logger.info(f"Command processed successfully")
                else:
                    error_msg = "I'm sorry, I couldn't understand that command."
                    if callback:
                        callback(error_msg)
                    if source == "voice":
                        self.tts.speak(error_msg)
        
        except Exception as e:
            logger.error(f"Error processing command: {e}")
            self.stats['errors'] += 1
            error_msg = "I encountered an error processing that command."
            if source == "voice":
                self.tts.speak(error_msg)
        
        finally:
            self.is_processing = False
            self.wake_word_detected = False
    
    def add_response_callback(self, callback: Callable):
        """Add a callback for command responses."""
        self.response_callbacks.append(callback)
    
    def get_status(self) -> Dict[str, Any]:
        """Get current system status."""
        return {
            'listening': self.is_listening,
            'processing': self.is_processing,
            'speaking': self.is_speaking,
            'wake_word_detected': self.wake_word_detected,
            'voice_available': self.voice_recognition.is_available(),
            'tts_available': self.tts.is_available(),
            'plugins_loaded': len(self.plugin_manager.get_loaded_plugins()),
            'stats': self.stats.copy()
        }
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history."""
        return self.conversation_manager.get_history()
    
    def clear_conversation_history(self):
        """Clear conversation history."""
        self.conversation_manager.clear_history()
    
    def set_user_preferences(self, preferences: Dict[str, Any]):
        """Update user preferences."""
        for key, value in preferences.items():
            self.config.set(key, value)
        
        # Apply changes to components
        self.voice_recognition.update_config(self.config)
        self.tts.update_config(self.config)
    
    def get_available_plugins(self) -> List[str]:
        """Get list of available plugins."""
        return self.plugin_manager.get_available_plugins()
    
    def enable_plugin(self, plugin_name: str) -> bool:
        """Enable a plugin."""
        return self.plugin_manager.enable_plugin(plugin_name)
    
    def disable_plugin(self, plugin_name: str) -> bool:
        """Disable a plugin."""
        return self.plugin_manager.disable_plugin(plugin_name)
    
    def emergency_stop(self):
        """Emergency stop all operations."""
        logger.warning("Emergency stop activated")
        
        self.stop_voice_recognition()
        self.tts.stop()
        self.is_processing = False
        self.is_speaking = False
        
        # Clear processing queue
        while not self.processing_queue.empty():
            try:
                self.processing_queue.get_nowait()
            except queue.Empty:
                break
    
    def cleanup(self):
        """Cleanup resources when shutting down."""
        logger.info("Cleaning up JARVIS Core")
        
        self.emergency_stop()
        
        # Save conversation history
        self.conversation_manager.save_history()
        
        # Cleanup components
        self.voice_recognition.cleanup()
        self.tts.cleanup()
        self.plugin_manager.cleanup()
        
        logger.info("JARVIS Core cleanup completed")
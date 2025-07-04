"""Configuration management for JARVIS."""

import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

class Config:
    """Configuration manager for JARVIS."""
    
    def __init__(self, config_file: str = "data/config.json"):
        """Initialize configuration manager."""
        self.config_file = Path(config_file)
        self.config_data = self._load_default_config()
        self._load_user_config()
    
    def _load_default_config(self) -> Dict[str, Any]:
        """Load default configuration settings."""
        return {
            # Voice Recognition Settings
            "voice_recognition_enabled": True,
            "wake_word": "hey jarvis",
            "voice_timeout": 5,
            "offline_mode": True,
            "vosk_model_path": "models/vosk-model-en-us-0.22",
            
            # Text-to-Speech Settings
            "tts_enabled": True,
            "tts_rate": 150,
            "tts_volume": 0.8,
            "tts_voice": "default",
            
            # UI Settings
            "theme": "dark",
            "font_size": 14,
            "show_visualizer": True,
            
            # Privacy Settings
            "data_encryption": True,
            "store_conversations": False,
            "auto_delete_logs": True,
            "log_retention_days": 7,
            
            # API Settings
            "openai_api_key": "",
            "weather_api_key": "",
            "news_api_key": "",
            
            # Device Control
            "device_control_enabled": True,
            "require_permission_confirmation": True,
            
            # Plugin Settings
            "enabled_plugins": [
                "basic_tasks",
                "calculator",
                "weather",
                "music_player",
                "device_control"
            ],
            
            # User Preferences
            "user_name": "User",
            "timezone": "UTC",
            "language": "en",
            "personalization_enabled": True,
            
            # Performance Settings
            "max_conversation_history": 100,
            "background_processing": True,
            "low_power_mode": False
        }
    
    def _load_user_config(self):
        """Load user configuration from file."""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    user_config = json.load(f)
                    self.config_data.update(user_config)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading user config: {e}")
    
    def save_config(self):
        """Save current configuration to file."""
        try:
            os.makedirs(self.config_file.parent, exist_ok=True)
            with open(self.config_file, 'w') as f:
                json.dump(self.config_data, f, indent=2)
        except IOError as e:
            print(f"Error saving config: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        return self.config_data.get(key, default)
    
    def set(self, key: str, value: Any):
        """Set configuration value."""
        self.config_data[key] = value
        self.save_config()
    
    def update(self, updates: Dict[str, Any]):
        """Update multiple configuration values."""
        self.config_data.update(updates)
        self.save_config()
    
    def reset_to_defaults(self):
        """Reset configuration to default values."""
        self.config_data = self._load_default_config()
        self.save_config()
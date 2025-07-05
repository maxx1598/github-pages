"""Plugin manager for modular JARVIS functionality."""

import os
import importlib
import importlib.util
import logging
import inspect
from typing import Dict, List, Any, Optional
from pathlib import Path
import re

from .config import Config
from .security import SecurityManager

logger = logging.getLogger(__name__)

class PluginBase:
    """Base class for all JARVIS plugins."""
    
    def __init__(self, config: Config, security_manager: SecurityManager):
        """Initialize plugin."""
        self.config = config
        self.security_manager = security_manager
        self.name = self.__class__.__name__
        self.enabled = True
    
    def initialize(self) -> bool:
        """Initialize plugin. Return True if successful."""
        return True
    
    def process_command(self, command: str) -> Optional[str]:
        """Process a command. Return response or None if not handled."""
        return None
    
    def get_commands(self) -> List[str]:
        """Get list of commands this plugin handles."""
        return []
    
    def get_help(self) -> str:
        """Get help text for this plugin."""
        return f"Plugin: {self.name}"
    
    def cleanup(self):
        """Cleanup plugin resources."""
        pass

class PluginManager:
    """Manages JARVIS plugins."""
    
    def __init__(self, config: Config, security_manager: SecurityManager):
        """Initialize plugin manager."""
        self.config = config
        self.security_manager = security_manager
        self.plugins: Dict[str, PluginBase] = {}
        self.plugin_commands: Dict[str, str] = {}  # command -> plugin_name
        
        # Plugin directories
        self.plugin_dirs = [
            Path("plugins"),
            Path("core/builtin_plugins")
        ]
        
        # Ensure plugin directories exist
        for plugin_dir in self.plugin_dirs:
            plugin_dir.mkdir(exist_ok=True)
        
        logger.info("Plugin manager initialized")
    
    def load_plugins(self):
        """Load all available plugins."""
        logger.info("Loading plugins...")
        
        # Load built-in plugins first
        self._load_builtin_plugins()
        
        # Load external plugins
        self._load_external_plugins()
        
        # Update command mappings
        self._update_command_mappings()
        
        enabled_plugins = self.config.get('enabled_plugins', [])
        for plugin_name in self.plugins:
            if plugin_name not in enabled_plugins:
                self.plugins[plugin_name].enabled = False
        
        logger.info(f"Loaded {len(self.plugins)} plugins")
    
    def _load_builtin_plugins(self):
        """Load built-in plugins."""
        builtin_plugins = [
            ('basic_tasks', BasicTasksPlugin),
            ('calculator', CalculatorPlugin),
            ('time_date', TimeDatePlugin),
            ('device_control', DeviceControlPlugin),
            ('weather', WeatherPlugin),
            ('music_player', MusicPlayerPlugin),
            ('notes', NotesPlugin),
            ('reminders', RemindersPlugin),
            ('system_info', SystemInfoPlugin),
            ('conversation', ConversationPlugin)
        ]
        
        for plugin_name, plugin_class in builtin_plugins:
            try:
                plugin_instance = plugin_class(self.config, self.security_manager)
                if plugin_instance.initialize():
                    self.plugins[plugin_name] = plugin_instance
                    logger.info(f"Loaded built-in plugin: {plugin_name}")
                else:
                    logger.warning(f"Failed to initialize built-in plugin: {plugin_name}")
            except Exception as e:
                logger.error(f"Error loading built-in plugin {plugin_name}: {e}")
    
    def _load_external_plugins(self):
        """Load external plugins from plugin directories."""
        for plugin_dir in self.plugin_dirs:
            if not plugin_dir.exists():
                continue
            
            for plugin_file in plugin_dir.glob("*.py"):
                if plugin_file.stem.startswith("__"):
                    continue
                
                try:
                    self._load_plugin_file(plugin_file)
                except Exception as e:
                    logger.error(f"Error loading plugin {plugin_file}: {e}")
    
    def _load_plugin_file(self, plugin_file: Path):
        """Load a plugin from a Python file."""
        module_name = f"jarvis_plugin_{plugin_file.stem}"
        
        spec = importlib.util.spec_from_file_location(module_name, plugin_file)
        if spec is None or spec.loader is None:
            logger.warning(f"Could not load plugin spec for {plugin_file}")
            return
        
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Find plugin classes in the module
        for name, obj in inspect.getmembers(module):
            if (inspect.isclass(obj) and 
                issubclass(obj, PluginBase) and 
                obj != PluginBase):
                
                plugin_name = plugin_file.stem
                plugin_instance = obj(self.config, self.security_manager)
                
                if plugin_instance.initialize():
                    self.plugins[plugin_name] = plugin_instance
                    logger.info(f"Loaded external plugin: {plugin_name}")
                else:
                    logger.warning(f"Failed to initialize external plugin: {plugin_name}")
                break
    
    def _update_command_mappings(self):
        """Update command to plugin mappings."""
        self.plugin_commands.clear()
        
        for plugin_name, plugin in self.plugins.items():
            if plugin.enabled:
                for command in plugin.get_commands():
                    self.plugin_commands[command.lower()] = plugin_name
    
    def process_command(self, command: str) -> Optional[str]:
        """Process a command with the appropriate plugin."""
        command_lower = command.lower().strip()
        
        # Try exact command matches first
        for cmd, plugin_name in self.plugin_commands.items():
            if cmd in command_lower:
                plugin = self.plugins.get(plugin_name)
                if plugin and plugin.enabled:
                    response = plugin.process_command(command)
                    if response:
                        return response
        
        # Try all enabled plugins for fuzzy matching
        for plugin_name, plugin in self.plugins.items():
            if plugin.enabled:
                response = plugin.process_command(command)
                if response:
                    return response
        
        return None
    
    def get_loaded_plugins(self) -> List[str]:
        """Get list of loaded plugin names."""
        return list(self.plugins.keys())
    
    def get_available_plugins(self) -> List[str]:
        """Get list of available plugin names."""
        return self.get_loaded_plugins()
    
    def enable_plugin(self, plugin_name: str) -> bool:
        """Enable a plugin."""
        if plugin_name in self.plugins:
            self.plugins[plugin_name].enabled = True
            self._update_command_mappings()
            
            # Update config
            enabled_plugins = self.config.get('enabled_plugins', [])
            if plugin_name not in enabled_plugins:
                enabled_plugins.append(plugin_name)
                self.config.set('enabled_plugins', enabled_plugins)
            
            logger.info(f"Enabled plugin: {plugin_name}")
            return True
        return False
    
    def disable_plugin(self, plugin_name: str) -> bool:
        """Disable a plugin."""
        if plugin_name in self.plugins:
            self.plugins[plugin_name].enabled = False
            self._update_command_mappings()
            
            # Update config
            enabled_plugins = self.config.get('enabled_plugins', [])
            if plugin_name in enabled_plugins:
                enabled_plugins.remove(plugin_name)
                self.config.set('enabled_plugins', enabled_plugins)
            
            logger.info(f"Disabled plugin: {plugin_name}")
            return True
        return False
    
    def get_plugin_info(self, plugin_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a plugin."""
        if plugin_name in self.plugins:
            plugin = self.plugins[plugin_name]
            return {
                'name': plugin_name,
                'enabled': plugin.enabled,
                'commands': plugin.get_commands(),
                'help': plugin.get_help()
            }
        return None
    
    def get_all_commands(self) -> Dict[str, str]:
        """Get all available commands and their descriptions."""
        commands = {}
        for plugin_name, plugin in self.plugins.items():
            if plugin.enabled:
                plugin_commands = plugin.get_commands()
                for cmd in plugin_commands:
                    commands[cmd] = f"{plugin_name}: {cmd}"
        return commands
    
    def cleanup(self):
        """Cleanup all plugins."""
        logger.info("Cleaning up plugins")
        for plugin in self.plugins.values():
            try:
                plugin.cleanup()
            except Exception as e:
                logger.error(f"Error cleaning up plugin {plugin.name}: {e}")


# Built-in plugin implementations

class BasicTasksPlugin(PluginBase):
    """Basic task handling plugin."""
    
    def get_commands(self) -> List[str]:
        return ['hello', 'hi', 'goodbye', 'bye', 'thank you', 'thanks', 'help']
    
    def process_command(self, command: str) -> Optional[str]:
        command_lower = command.lower().strip()
        
        if any(word in command_lower for word in ['hello', 'hi']):
            return f"Hello! I'm JARVIS, your AI assistant. How can I help you today?"
        
        elif any(word in command_lower for word in ['goodbye', 'bye']):
            return "Goodbye! Have a great day!"
        
        elif any(word in command_lower for word in ['thank you', 'thanks']):
            return "You're welcome! I'm always here to help."
        
        elif 'help' in command_lower:
            return ("I can help you with various tasks like calculations, weather, music, "
                   "device control, reminders, and more. Just ask me naturally!")
        
        return None
    
    def get_help(self) -> str:
        return "Handles basic greetings and help requests"


class CalculatorPlugin(PluginBase):
    """Calculator plugin for mathematical operations."""
    
    def get_commands(self) -> List[str]:
        return ['calculate', 'math', 'plus', 'minus', 'multiply', 'divide', 'what is']
    
    def process_command(self, command: str) -> Optional[str]:
        command_lower = command.lower().strip()
        
        # Look for mathematical expressions
        math_patterns = [
            r'what is ([\d\+\-\*\/\.\(\)\s]+)',
            r'calculate ([\d\+\-\*\/\.\(\)\s]+)',
            r'([\d\+\-\*\/\.\(\)\s]+) equals?',
            r'(\d+(?:\.\d+)?)\s*(\+|\-|\*|\/)\s*(\d+(?:\.\d+)?)'
        ]
        
        for pattern in math_patterns:
            match = re.search(pattern, command_lower)
            if match:
                try:
                    expression = match.group(1).strip()
                    # Simple safety check
                    if re.match(r'^[\d\+\-\*\/\.\(\)\s]+$', expression):
                        result = eval(expression)
                        return f"The answer is {result}"
                except:
                    return "I couldn't calculate that expression. Please check the format."
        
        return None
    
    def get_help(self) -> str:
        return "Performs mathematical calculations"


class TimeDatePlugin(PluginBase):
    """Time and date plugin."""
    
    def get_commands(self) -> List[str]:
        return ['time', 'date', 'what time', 'what date', 'current time', 'current date']
    
    def process_command(self, command: str) -> Optional[str]:
        command_lower = command.lower().strip()
        
        if 'time' in command_lower:
            from datetime import datetime
            now = datetime.now()
            return f"The current time is {now.strftime('%I:%M %p')}"
        
        elif 'date' in command_lower:
            from datetime import datetime
            now = datetime.now()
            return f"Today's date is {now.strftime('%A, %B %d, %Y')}"
        
        return None
    
    def get_help(self) -> str:
        return "Provides current time and date information"


class DeviceControlPlugin(PluginBase):
    """Device control plugin for Android-specific functions."""
    
    def get_commands(self) -> List[str]:
        return ['flashlight', 'wifi', 'bluetooth', 'airplane mode', 'volume', 'brightness']
    
    def process_command(self, command: str) -> Optional[str]:
        command_lower = command.lower().strip()
        
        if 'flashlight' in command_lower:
            if 'on' in command_lower or 'turn on' in command_lower:
                return "I would turn on the flashlight, but device control requires additional permissions."
            elif 'off' in command_lower or 'turn off' in command_lower:
                return "I would turn off the flashlight, but device control requires additional permissions."
            else:
                return "Do you want to turn the flashlight on or off?"
        
        elif 'wifi' in command_lower:
            return "WiFi control requires system-level permissions on Android."
        
        elif 'volume' in command_lower:
            return "Volume control functionality would be implemented with Android permissions."
        
        return None
    
    def get_help(self) -> str:
        return "Controls device functions like flashlight, WiFi, etc. (requires permissions)"


class WeatherPlugin(PluginBase):
    """Weather information plugin."""
    
    def get_commands(self) -> List[str]:
        return ['weather', 'temperature', 'forecast', 'how hot', 'how cold']
    
    def process_command(self, command: str) -> Optional[str]:
        command_lower = command.lower().strip()
        
        if any(word in command_lower for word in ['weather', 'temperature', 'forecast']):
            api_key = self.config.get('weather_api_key', '')
            if not api_key:
                return ("I need a weather API key to provide weather information. "
                       "Please configure it in settings.")
            
            # This would normally make an API call
            return ("Weather functionality is configured but requires an active internet "
                   "connection and valid API key.")
        
        return None
    
    def get_help(self) -> str:
        return "Provides weather information (requires API key and internet)"


class MusicPlayerPlugin(PluginBase):
    """Music player control plugin."""
    
    def get_commands(self) -> List[str]:
        return ['play music', 'stop music', 'pause music', 'next song', 'previous song']
    
    def process_command(self, command: str) -> Optional[str]:
        command_lower = command.lower().strip()
        
        if 'play music' in command_lower:
            return "I would start playing music from your device's music library."
        elif 'stop music' in command_lower:
            return "I would stop the current music playback."
        elif 'pause music' in command_lower:
            return "I would pause the current music playback."
        
        return None
    
    def get_help(self) -> str:
        return "Controls music playback on the device"


class NotesPlugin(PluginBase):
    """Notes management plugin."""
    
    def __init__(self, config: Config, security_manager: SecurityManager):
        super().__init__(config, security_manager)
        self.notes_file = Path("data/notes.json")
        self.notes = self._load_notes()
    
    def _load_notes(self) -> List[Dict[str, Any]]:
        if self.notes_file.exists():
            try:
                with open(self.notes_file, 'r') as f:
                    import json
                    return json.load(f)
            except:
                return []
        return []
    
    def _save_notes(self):
        self.notes_file.parent.mkdir(exist_ok=True)
        with open(self.notes_file, 'w') as f:
            import json
            json.dump(self.notes, f, indent=2)
    
    def get_commands(self) -> List[str]:
        return ['take note', 'save note', 'read notes', 'list notes']
    
    def process_command(self, command: str) -> Optional[str]:
        command_lower = command.lower().strip()
        
        if 'take note' in command_lower or 'save note' in command_lower:
            # Extract note content
            note_text = command.replace('take note', '').replace('save note', '').strip()
            if note_text:
                from datetime import datetime
                note = {
                    'text': note_text,
                    'timestamp': datetime.now().isoformat()
                }
                self.notes.append(note)
                self._save_notes()
                return f"Note saved: {note_text}"
            else:
                return "What would you like me to save as a note?"
        
        elif 'read notes' in command_lower or 'list notes' in command_lower:
            if not self.notes:
                return "You don't have any notes saved."
            
            note_list = []
            for i, note in enumerate(self.notes[-5:], 1):  # Last 5 notes
                note_list.append(f"{i}. {note['text']}")
            
            return "Your recent notes:\n" + "\n".join(note_list)
        
        return None
    
    def get_help(self) -> str:
        return "Manages personal notes and reminders"


class RemindersPlugin(PluginBase):
    """Reminders management plugin."""
    
    def get_commands(self) -> List[str]:
        return ['remind me', 'set reminder', 'list reminders']
    
    def process_command(self, command: str) -> Optional[str]:
        command_lower = command.lower().strip()
        
        if 'remind me' in command_lower or 'set reminder' in command_lower:
            return ("Reminder functionality is available but requires implementation "
                   "of background scheduling.")
        
        elif 'list reminders' in command_lower:
            return "You don't have any active reminders."
        
        return None
    
    def get_help(self) -> str:
        return "Manages reminders and scheduled notifications"


class SystemInfoPlugin(PluginBase):
    """System information plugin."""
    
    def get_commands(self) -> List[str]:
        return ['system info', 'battery', 'storage', 'memory']
    
    def process_command(self, command: str) -> Optional[str]:
        command_lower = command.lower().strip()
        
        if 'system info' in command_lower:
            return "System information would show device details, OS version, etc."
        elif 'battery' in command_lower:
            return "Battery information requires Android permissions to access."
        elif 'storage' in command_lower:
            return "Storage information would show available and used space."
        
        return None
    
    def get_help(self) -> str:
        return "Provides system and device information"


class ConversationPlugin(PluginBase):
    """Conversation and chat plugin."""
    
    def get_commands(self) -> List[str]:
        return ['chat', 'talk', 'conversation']
    
    def process_command(self, command: str) -> Optional[str]:
        command_lower = command.lower().strip()
        
        # This is a fallback for general conversation
        responses = [
            "I'm here to help! What would you like to know?",
            "That's interesting. Can you tell me more?",
            "I understand. Is there anything specific I can help you with?",
            "I'm listening. How can I assist you today?",
            "Feel free to ask me anything!"
        ]
        
        import random
        return random.choice(responses)
    
    def get_help(self) -> str:
        return "Handles general conversation and fallback responses"
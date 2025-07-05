#!/usr/bin/env python3
"""
JARVIS AI Assistant - Simple Test Version
This version runs without Kivy dependencies for testing core functionality.
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleConfig:
    """Simplified configuration management."""
    
    def __init__(self):
        self.config_file = Path("data/config.json")
        self.config_data = self._load_default_config()
        self._load_user_config()
    
    def _load_default_config(self):
        return {
            "voice_recognition_enabled": False,  # Disabled for simple test
            "wake_word": "hey jarvis",
            "tts_enabled": False,  # Disabled for simple test
            "theme": "dark",
            "enabled_plugins": ["basic_tasks", "calculator", "time_date"]
        }
    
    def _load_user_config(self):
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    user_config = json.load(f)
                    self.config_data.update(user_config)
            except Exception as e:
                logger.warning(f"Error loading config: {e}")
    
    def get(self, key, default=None):
        return self.config_data.get(key, default)
    
    def set(self, key, value):
        self.config_data[key] = value

class SimplePlugin:
    """Base class for simple plugins."""
    
    def __init__(self, config):
        self.config = config
        self.name = self.__class__.__name__
    
    def process_command(self, command):
        return None
    
    def get_commands(self):
        return []

class BasicTasksPlugin(SimplePlugin):
    """Basic greetings and help."""
    
    def get_commands(self):
        return ['hello', 'hi', 'help', 'goodbye', 'thanks']
    
    def process_command(self, command):
        cmd = command.lower().strip()
        
        if any(word in cmd for word in ['hello', 'hi']):
            return "Hello! I'm JARVIS, your AI assistant. How can I help you today?"
        elif 'help' in cmd:
            return ("I can help you with:\n"
                   "- Basic greetings (hello, hi)\n"
                   "- Math calculations (calculate 2+2)\n"
                   "- Current time (what time is it)\n"
                   "- And much more!")
        elif any(word in cmd for word in ['goodbye', 'bye']):
            return "Goodbye! Have a great day!"
        elif any(word in cmd for word in ['thanks', 'thank you']):
            return "You're welcome! Happy to help."
        
        return None

class CalculatorPlugin(SimplePlugin):
    """Simple calculator functionality."""
    
    def get_commands(self):
        return ['calculate', 'math', 'what is']
    
    def process_command(self, command):
        cmd = command.lower().strip()
        
        # Look for mathematical expressions
        import re
        
        patterns = [
            r'calculate\s+([\d\+\-\*\/\.\(\)\s]+)',
            r'what is\s+([\d\+\-\*\/\.\(\)\s]+)',
            r'math\s+([\d\+\-\*\/\.\(\)\s]+)',
            r'([\d\+\-\*\/\.\(\)\s]+)\s*=',
            r'(\d+(?:\.\d+)?)\s*(\+|\-|\*|\/)\s*(\d+(?:\.\d+)?)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, cmd)
            if match:
                try:
                    expression = match.group(1).strip()
                    # Simple safety check
                    if re.match(r'^[\d\+\-\*\/\.\(\)\s]+$', expression):
                        result = eval(expression)
                        return f"The answer is: {result}"
                except Exception as e:
                    return f"Sorry, I couldn't calculate that: {str(e)}"
        
        return None

class TimeDatePlugin(SimplePlugin):
    """Time and date information."""
    
    def get_commands(self):
        return ['time', 'date', 'what time']
    
    def process_command(self, command):
        cmd = command.lower().strip()
        
        if 'time' in cmd:
            now = datetime.now()
            return f"The current time is: {now.strftime('%I:%M %p')}"
        elif 'date' in cmd:
            now = datetime.now()
            return f"Today's date is: {now.strftime('%A, %B %d, %Y')}"
        
        return None

class SimpleJarvis:
    """Simplified JARVIS core for testing."""
    
    def __init__(self):
        self.config = SimpleConfig()
        self.plugins = []
        self._load_plugins()
        
        # Ensure data directory exists
        os.makedirs('data', exist_ok=True)
        
        logger.info("Simple JARVIS initialized")
    
    def _load_plugins(self):
        """Load simple plugins."""
        plugin_classes = [BasicTasksPlugin, CalculatorPlugin, TimeDatePlugin]
        
        for plugin_class in plugin_classes:
            try:
                plugin = plugin_class(self.config)
                self.plugins.append(plugin)
                logger.info(f"Loaded plugin: {plugin.name}")
            except Exception as e:
                logger.error(f"Error loading plugin {plugin_class.__name__}: {e}")
    
    def process_command(self, command):
        """Process a text command."""
        logger.info(f"Processing command: {command}")
        
        # Try each plugin
        for plugin in self.plugins:
            try:
                response = plugin.process_command(command)
                if response:
                    logger.info(f"Response from {plugin.name}: {response}")
                    return response
            except Exception as e:
                logger.error(f"Error in plugin {plugin.name}: {e}")
        
        # Fallback response
        return "I'm sorry, I didn't understand that command. Try 'help' for available commands."
    
    def get_status(self):
        """Get system status."""
        return {
            'plugins_loaded': len(self.plugins),
            'voice_enabled': self.config.get('voice_recognition_enabled', False),
            'tts_enabled': self.config.get('tts_enabled', False),
            'uptime': 'Running'
        }

def print_welcome():
    """Print welcome message."""
    print("🤖 JARVIS AI Assistant - Test Version")
    print("=====================================")
    print("This is a simplified version for testing core functionality.")
    print("Type 'help' for available commands or 'quit' to exit.")
    print("Example commands:")
    print("  - hello")
    print("  - calculate 15 + 25")
    print("  - what time is it")
    print("  - help")
    print("-" * 50)

def main():
    """Main function for simple JARVIS test."""
    
    print_welcome()
    
    try:
        # Initialize JARVIS
        jarvis = SimpleJarvis()
        
        # Interactive loop
        while True:
            try:
                # Get user input
                user_input = input("\n🎤 You: ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() in ['quit', 'exit', 'bye']:
                    print("🤖 JARVIS: Goodbye! To build the full Android app, run: ./build_apk.sh")
                    break
                
                # Process command
                response = jarvis.process_command(user_input)
                print(f"🤖 JARVIS: {response}")
                
            except KeyboardInterrupt:
                print("\n🤖 JARVIS: Goodbye!")
                break
            except Exception as e:
                print(f"🤖 JARVIS: Sorry, I encountered an error: {e}")
    
    except Exception as e:
        logger.error(f"Error starting JARVIS: {e}")
        print(f"❌ Error: {e}")
        print("\n💡 To install full dependencies and build Android APK:")
        print("   pip install -r requirements.txt")
        print("   ./build_apk.sh")

if __name__ == "__main__":
    main()
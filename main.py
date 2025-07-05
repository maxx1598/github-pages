#!/usr/bin/env python3
"""
JARVIS - Just A Rather Very Intelligent System
A smart AI assistant for mobile devices with offline and online capabilities.
"""

import os
import sys
import threading
import json
from pathlib import Path

# Kivy imports for Android compatibility
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.scrollview import ScrollView
from kivy.clock import Clock, mainthread
from kivy.logger import Logger
from kivy.utils import platform

# Core JARVIS modules
from core.jarvis_core import JarvisCore
from core.config import Config
from core.security import SecurityManager
from ui.jarvis_ui import JarvisUI

class JarvisApp(App):
    """Main JARVIS Application class."""
    
    def build(self):
        """Build the main application interface."""
        Logger.info("JARVIS: Starting JARVIS AI Assistant")
        
        # Initialize core components
        self.config = Config()
        self.security_manager = SecurityManager()
        self.jarvis_core = JarvisCore(self.config, self.security_manager)
        
        # Initialize UI
        self.ui = JarvisUI(self.jarvis_core)
        
        # Set up the main layout
        return self.ui.build_interface()
    
    def on_start(self):
        """Called when the application starts."""
        Logger.info("JARVIS: Application started")
        
        # Initialize JARVIS core systems
        self.jarvis_core.initialize()
        
        # Start voice recognition if enabled
        if self.config.get('voice_recognition_enabled', True):
            self.jarvis_core.start_voice_recognition()
    
    def on_stop(self):
        """Called when the application stops."""
        Logger.info("JARVIS: Application stopping")
        
        # Cleanup resources
        self.jarvis_core.cleanup()
    
    def on_pause(self):
        """Called when the application is paused."""
        return True
    
    def on_resume(self):
        """Called when the application resumes."""
        pass

def main():
    """Main entry point."""
    # Ensure required directories exist
    os.makedirs('data', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    os.makedirs('plugins', exist_ok=True)
    
    # Start the application
    JarvisApp().run()

if __name__ == '__main__':
    main()
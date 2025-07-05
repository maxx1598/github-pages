# JARVIS - Just A Rather Very Intelligent System 🤖

A comprehensive AI assistant designed for mobile devices (Android) with both offline and online capabilities. JARVIS combines voice recognition, text-to-speech, smart task automation, and a beautiful modern UI built with Kivy.

## ✨ Features

### 🎤 Voice & Speech
- **Offline Voice Recognition** using Vosk models
- **Wake Word Detection** ("Hey JARVIS")
- **Text-to-Speech** with customizable voice settings
- **Multilingual Support** (expandable)

### 📱 Mobile-First Design
- **Native Android UI** using Kivy framework
- **Touch-Optimized Interface** with modern design
- **Responsive Layout** for different screen sizes
- **Dark & Light Themes**

### 🔒 Privacy & Security
- **Local Data Encryption** using cryptography
- **Offline-First Architecture** - works without internet
- **Secure Data Storage** with user control
- **No Cloud Dependencies** for basic functions

### 🧩 Modular Plugin System
- **Extensible Architecture** - easily add new features
- **Built-in Plugins** for common tasks
- **Custom Plugin Support** with Python API
- **Hot-Pluggable** - enable/disable without restart

### 🛠 Smart Automation
- **Device Control** (flashlight, WiFi, volume, etc.)
- **Calendar & Reminders** management
- **Note Taking** with voice dictation
- **Music Player** control
- **Calculator** with natural language
- **Weather Information** (API integration)
- **System Information** and monitoring

### 🌐 Online Capabilities
- **ChatGPT Integration** for advanced conversations
- **Weather APIs** for real-time data
- **News Fetching** from various sources
- **Web Search** capabilities
- **Email & Messaging** integration

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ 
- Android device (API level 21+)
- Development environment (for building APK)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/jarvis-ai/jarvis-assistant.git
cd jarvis-assistant
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Run on desktop (for testing)**
```bash
python main.py
```

4. **Build Android APK**
```bash
# Install buildozer
pip install buildozer

# Initialize and build
buildozer android debug
```

The APK will be generated in `bin/` directory.

## 📋 Configuration

JARVIS uses a JSON configuration file at `data/config.json`. Key settings include:

```json
{
  "voice_recognition_enabled": true,
  "wake_word": "hey jarvis",
  "tts_enabled": true,
  "tts_rate": 150,
  "theme": "dark",
  "data_encryption": true,
  "enabled_plugins": [
    "basic_tasks",
    "calculator", 
    "weather",
    "device_control"
  ]
}
```

## 🎛 Available Commands

### Basic Interaction
- "Hello" / "Hi" - Greetings
- "Help" - Show available commands
- "Thank you" - Acknowledgment
- "Goodbye" - Exit interaction

### Calculations
- "Calculate 15 + 25"
- "What is 10 * 6?"
- "Math: (45 + 32) / 7"

### Time & Date
- "What time is it?"
- "What's today's date?"
- "Current time"

### Device Control
- "Turn on flashlight"
- "Toggle WiFi"
- "Volume up/down"

### Notes & Reminders  
- "Take note: Meeting at 3 PM"
- "Read my notes"
- "Remind me to call John"

### System Information
- "System status"
- "Battery level"
- "Storage info"

### Weather (requires API key)
- "What's the weather?"
- "Temperature today"
- "Weather forecast"

## 🔧 Plugin Development

Create custom plugins by extending the `PluginBase` class:

```python
from core.plugin_manager import PluginBase

class MyCustomPlugin(PluginBase):
    def get_commands(self) -> List[str]:
        return ['my command', 'custom task']
    
    def process_command(self, command: str) -> Optional[str]:
        if 'my command' in command.lower():
            return "This is my custom response!"
        return None
    
    def get_help(self) -> str:
        return "My custom plugin description"
```

Place plugins in the `plugins/` directory and they'll be automatically loaded.

## 📱 Android Permissions

JARVIS requires these Android permissions:
- **RECORD_AUDIO** - Voice recognition
- **INTERNET** - Online features
- **WRITE_EXTERNAL_STORAGE** - Data storage
- **CAMERA** - Camera access
- **FLASHLIGHT** - Flashlight control
- **ACCESS_WIFI_STATE** - Network status
- **VIBRATE** - Haptic feedback

## 🏗 Architecture

```
JARVIS/
├── main.py              # Application entry point
├── core/                # Core system components
│   ├── jarvis_core.py   # Main orchestrator
│   ├── config.py        # Configuration management
│   ├── security.py      # Security & encryption
│   ├── voice_recognition.py # Voice input
│   ├── text_to_speech.py    # Speech output
│   ├── plugin_manager.py    # Plugin system
│   └── conversation_manager.py # Chat history
├── ui/                  # User interface
│   └── jarvis_ui.py     # Kivy-based GUI
├── plugins/             # Plugin modules
├── data/                # User data & config
├── models/              # AI models (Vosk, etc.)
└── logs/                # Application logs
```

## 🛡 Privacy & Security

- **Local Processing**: Core functions work offline
- **Encrypted Storage**: User data encrypted with Fernet
- **No Tracking**: No analytics or user tracking
- **User Control**: Complete control over data storage
- **Secure Communication**: HTTPS for online features
- **Permission Management**: Granular Android permissions

## 🔄 Updates & Maintenance

- **Automatic Plugin Updates**: Plugins can be updated independently
- **Configuration Backup**: Settings backed up securely
- **Log Rotation**: Automatic cleanup of old logs
- **Model Updates**: Voice models can be updated separately

## 🐛 Troubleshooting

### Common Issues

1. **Voice Recognition Not Working**
   - Check microphone permissions
   - Verify Vosk model is downloaded
   - Test microphone with other apps

2. **Build Errors**
   - Update buildozer: `pip install --upgrade buildozer`
   - Clear build cache: `buildozer android clean`
   - Check Android SDK installation

3. **Plugin Not Loading**
   - Verify plugin syntax
   - Check plugin is in enabled list
   - Review logs for error messages

### Debug Mode
Enable debug logging by setting `log_level = 2` in buildozer.spec

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

### Development Setup

```bash
# Install development dependencies
pip install -r requirements.txt
pip install -e .[dev]

# Run tests
pytest

# Code formatting
black .
flake8 .
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kivy Team** - Mobile UI framework
- **Vosk** - Offline speech recognition
- **pyttsx3** - Text-to-speech engine
- **Cryptography** - Security libraries
- **Python Community** - Amazing ecosystem

## 📞 Support

- **Documentation**: [Wiki](https://github.com/jarvis-ai/jarvis-assistant/wiki)
- **Issues**: [GitHub Issues](https://github.com/jarvis-ai/jarvis-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jarvis-ai/jarvis-assistant/discussions)

---

**⚡ Start building your AI assistant today!**

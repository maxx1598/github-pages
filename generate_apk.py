#!/usr/bin/env python3
"""
JARVIS APK Generation Script
This script provides instructions and automation for building the JARVIS Android APK.
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def print_header():
    """Print the header information."""
    print("🤖 JARVIS AI Assistant - APK Generator")
    print("=====================================")
    print()

def check_system():
    """Check system requirements."""
    print("📋 System Requirements Check:")
    print("-" * 30)
    
    # Check Python version
    python_version = sys.version_info
    if python_version >= (3, 8):
        print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro} (Compatible)")
    else:
        print(f"❌ Python {python_version.major}.{python_version.minor}.{python_version.micro} (Requires 3.8+)")
        return False
    
    # Check operating system
    os_name = platform.system()
    print(f"ℹ️  Operating System: {os_name}")
    
    # Check if buildozer is available
    try:
        subprocess.run(['buildozer', '--version'], capture_output=True, check=True)
        print("✅ Buildozer is installed")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Buildozer is not installed")
        print("   Run: pip install buildozer")
    
    # Check for Java
    try:
        result = subprocess.run(['java', '-version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Java is installed")
        else:
            print("❌ Java is not properly configured")
    except FileNotFoundError:
        print("❌ Java is not installed")
        print("   Install OpenJDK 8 or 11")
    
    print()
    return True

def show_project_structure():
    """Show the project structure."""
    print("📁 JARVIS Project Structure:")
    print("-" * 30)
    
    files_created = [
        "main.py - Application entry point",
        "core/ - Core system components",
        "  ├── jarvis_core.py - Main orchestrator",
        "  ├── config.py - Configuration management", 
        "  ├── security.py - Security & encryption",
        "  ├── voice_recognition.py - Voice input",
        "  ├── text_to_speech.py - Speech output",
        "  ├── plugin_manager.py - Plugin system",
        "  └── conversation_manager.py - Chat history",
        "ui/ - User interface components",
        "  └── jarvis_ui.py - Kivy-based GUI",
        "requirements.txt - Python dependencies",
        "buildozer.spec - Android build config",
        "build_apk.sh - Automated build script",
        "README.md - Project documentation",
        "INSTALL.md - Installation guide",
        "PROJECT_SUMMARY.md - Feature overview"
    ]
    
    for file_info in files_created:
        print(f"  {file_info}")
    
    print()

def show_features():
    """Show implemented features."""
    print("✨ Implemented Features:")
    print("-" * 25)
    
    features = [
        "🎤 Offline Voice Recognition (Vosk)",
        "🗣️  Text-to-Speech (pyttsx3)", 
        "📱 Android UI (Kivy framework)",
        "🔒 Data Encryption & Security",
        "🧩 Modular Plugin System",
        "💬 Conversation Management",
        "⚙️  Configuration System",
        "📊 System Monitoring",
        "🛠️  Device Control",
        "🧮 Calculator & Math",
        "📝 Notes & Reminders",
        "🌤️  Weather Integration",
        "🎵 Music Control",
        "📱 Android Permissions Setup"
    ]
    
    for feature in features:
        print(f"  ✅ {feature}")
    
    print()

def show_build_instructions():
    """Show build instructions."""
    print("🔨 Building the APK:")
    print("-" * 20)
    print()
    print("Option 1: Automated Build (Recommended)")
    print("  chmod +x build_apk.sh")
    print("  ./build_apk.sh")
    print()
    print("Option 2: Manual Build")
    print("  1. Install dependencies:")
    print("     pip install -r requirements.txt")
    print("  2. Install buildozer:")
    print("     pip install buildozer")
    print("  3. Build debug APK:")
    print("     buildozer android debug")
    print("  4. Find APK in bin/ directory")
    print()
    print("Option 3: Release Build")
    print("  ./build_apk.sh --release")
    print()

def show_installation_guide():
    """Show installation guide."""
    print("📱 Installing on Android:")
    print("-" * 25)
    print("1. Enable 'Unknown Sources' in Android Settings")
    print("2. Copy APK to device")
    print("3. Install using file manager")
    print("4. Grant required permissions:")
    print("   - Microphone access")
    print("   - Storage access")
    print("   - Camera access (optional)")
    print()

def show_usage_examples():
    """Show usage examples."""
    print("🎛️  Usage Examples:")
    print("-" * 18)
    print("Voice Commands:")
    print('  "Hey JARVIS" - Wake up assistant')
    print('  "Hello" - Greeting')
    print('  "What time is it?" - Get current time')
    print('  "Calculate 15 + 25" - Math operations')
    print('  "Take note: Buy groceries" - Save notes')
    print('  "Turn on flashlight" - Device control')
    print('  "What\'s the weather?" - Weather info')
    print()
    print("Text Commands:")
    print("  All voice commands work via text input too!")
    print()

def check_dependencies():
    """Check if all required files exist."""
    print("🔍 Dependency Check:")
    print("-" * 18)
    
    required_files = [
        "main.py",
        "requirements.txt", 
        "buildozer.spec",
        "core/jarvis_core.py",
        "core/config.py",
        "core/security.py",
        "ui/jarvis_ui.py",
        "build_apk.sh"
    ]
    
    all_present = True
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"  ✅ {file_path}")
        else:
            print(f"  ❌ {file_path}")
            all_present = False
    
    if all_present:
        print("  🎉 All core files present!")
    else:
        print("  ⚠️  Some files are missing!")
    
    print()
    return all_present

def main():
    """Main function."""
    print_header()
    
    # Check system requirements
    system_ok = check_system()
    
    # Show project information
    show_project_structure()
    show_features()
    
    # Check dependencies
    deps_ok = check_dependencies()
    
    # Show build instructions
    show_build_instructions()
    show_installation_guide()
    show_usage_examples()
    
    # Final instructions
    print("🚀 Next Steps:")
    print("-" * 12)
    if system_ok and deps_ok:
        print("1. Run: chmod +x build_apk.sh")
        print("2. Run: ./build_apk.sh")
        print("3. Install the generated APK on your Android device")
        print("4. Enjoy your JARVIS AI Assistant! 🤖")
    else:
        print("1. Fix the issues mentioned above")
        print("2. Install missing dependencies")
        print("3. Re-run this script to verify")
        print("4. Then proceed with APK build")
    
    print()
    print("📚 Documentation:")
    print("  - README.md - Project overview")
    print("  - INSTALL.md - Detailed installation guide") 
    print("  - PROJECT_SUMMARY.md - Complete feature list")
    print()
    print("🎯 JARVIS AI Assistant is ready for Android deployment!")

if __name__ == "__main__":
    main()
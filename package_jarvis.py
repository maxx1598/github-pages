#!/usr/bin/env python3
"""
JARVIS Packaging Script
Creates a zip file with all JARVIS project files for easy distribution.
"""

import os
import zipfile
import shutil
from pathlib import Path
from datetime import datetime

def create_jarvis_package():
    """Create a zip package with all JARVIS files."""
    
    print("📦 JARVIS AI Assistant - Packaging Script")
    print("=========================================")
    print()
    
    # Define package name with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    package_name = f"JARVIS_AI_Assistant_{timestamp}.zip"
    
    # Files to include in the package
    jarvis_files = [
        # Core application files
        "main.py",
        "generate_apk.py",
        "setup.py",
        
        # Core modules
        "core/__init__.py",
        "core/config.py", 
        "core/security.py",
        "core/jarvis_core.py",
        "core/voice_recognition.py",
        "core/text_to_speech.py",
        "core/plugin_manager.py",
        "core/conversation_manager.py",
        
        # UI modules
        "ui/__init__.py",
        "ui/jarvis_ui.py",
        
        # Configuration and build files
        "requirements.txt",
        "buildozer.spec",
        "build_apk.sh",
        
        # Documentation
        "README.md",
        "INSTALL.md", 
        "PROJECT_SUMMARY.md",
        "LICENSE",
        ".gitignore"
    ]
    
    print(f"📁 Creating package: {package_name}")
    print(f"📋 Including {len(jarvis_files)} files...")
    print()
    
    try:
        with zipfile.ZipFile(package_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            files_added = 0
            
            for file_path in jarvis_files:
                if Path(file_path).exists():
                    zipf.write(file_path, file_path)
                    print(f"  ✅ Added: {file_path}")
                    files_added += 1
                else:
                    print(f"  ⚠️  Missing: {file_path}")
            
            # Add empty directories that should exist
            directories = ["data/", "logs/", "models/", "plugins/"]
            for directory in directories:
                zipf.writestr(directory + ".gitkeep", "# This directory is required for JARVIS\n")
                print(f"  📁 Added directory: {directory}")
        
        # Get file size
        file_size = Path(package_name).stat().st_size
        size_mb = file_size / (1024 * 1024)
        
        print()
        print("🎉 Package created successfully!")
        print(f"📦 File: {package_name}")
        print(f"📊 Size: {size_mb:.2f} MB")
        print(f"📁 Files included: {files_added}")
        print()
        print("📱 To build JARVIS APK:")
        print(f"  1. Extract {package_name}")
        print("  2. cd into the extracted folder")
        print("  3. chmod +x build_apk.sh")
        print("  4. ./build_apk.sh")
        print()
        print("🎯 Your JARVIS AI Assistant package is ready!")
        
        return package_name
        
    except Exception as e:
        print(f"❌ Error creating package: {e}")
        return None

def show_package_contents():
    """Show what will be included in the package."""
    print("📋 JARVIS Package Contents:")
    print("-" * 30)
    print("📱 Core Application:")
    print("  • main.py - Application entry point")
    print("  • generate_apk.py - APK build helper")
    print("  • setup.py - Package setup")
    print()
    print("🧠 Core System (7 modules):")
    print("  • jarvis_core.py - Main orchestrator")
    print("  • voice_recognition.py - Voice input (Vosk)")
    print("  • text_to_speech.py - Speech output (pyttsx3)")
    print("  • plugin_manager.py - Plugin system")
    print("  • config.py - Configuration management")
    print("  • security.py - Encryption & privacy")
    print("  • conversation_manager.py - Chat history")
    print()
    print("🎨 User Interface:")
    print("  • jarvis_ui.py - Kivy-based Android UI")
    print()
    print("🔧 Build & Config:")
    print("  • requirements.txt - Python dependencies")
    print("  • buildozer.spec - Android build config")
    print("  • build_apk.sh - Automated build script")
    print()
    print("📚 Documentation:")
    print("  • README.md - Project overview")
    print("  • INSTALL.md - Installation guide")
    print("  • PROJECT_SUMMARY.md - Complete features")
    print()
    print("🎯 Ready-to-build Android AI Assistant!")
    print()

def main():
    """Main function."""
    show_package_contents()
    
    response = input("Create JARVIS package? (y/n): ").lower().strip()
    
    if response in ['y', 'yes']:
        package_file = create_jarvis_package()
        
        if package_file:
            print(f"✅ Success! Package created: {package_file}")
            
            # Show next steps
            print()
            print("🚀 Next Steps:")
            print("1. Download/copy the zip file to your development machine")
            print("2. Extract the zip file")
            print("3. Follow INSTALL.md for building the Android APK")
            print("4. Install on your Android device and enjoy JARVIS!")
            
        else:
            print("❌ Failed to create package")
    else:
        print("📦 Package creation cancelled")

if __name__ == "__main__":
    main()
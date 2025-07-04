# JARVIS Installation Guide 📱

This guide will help you install and build JARVIS AI Assistant for Android devices.

## 🚀 Quick Installation

### Option 1: Automated Build Script (Recommended)

1. **Make the build script executable:**
   ```bash
   chmod +x build_apk.sh
   ```

2. **Run the build script:**
   ```bash
   ./build_apk.sh
   ```

   The script will automatically:
   - Check dependencies
   - Install required packages
   - Setup build environment
   - Build the debug APK

### Option 2: Manual Installation

Follow the detailed steps below for manual installation.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 18.04+), macOS, or Windows (WSL)
- **Python**: 3.8 or higher
- **Memory**: At least 8GB RAM (16GB recommended)
- **Storage**: 10GB free space for build tools
- **Internet**: Required for downloading dependencies

### Android Device Requirements
- **Android Version**: 5.0 (API level 21) or higher
- **Architecture**: ARM or ARM64
- **Storage**: 100MB free space
- **Permissions**: Allow installation from unknown sources

## 🛠 Manual Setup

### Step 1: Install System Dependencies

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-dev python3-venv
sudo apt install -y build-essential git zip unzip
sudo apt install -y libssl-dev libffi-dev libxml2-dev libxslt1-dev
sudo apt install -y libjpeg-dev zlib1g-dev libfreetype6-dev
sudo apt install -y libportaudio2 libportaudiocpp0 portaudio19-dev
```

#### macOS:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install python3 git portaudio
```

#### Windows (WSL):
```bash
# Enable WSL and install Ubuntu
# Then follow Ubuntu instructions above
```

### Step 2: Clone Repository

```bash
git clone https://github.com/jarvis-ai/jarvis-assistant.git
cd jarvis-assistant
```

### Step 3: Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 4: Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 5: Install Buildozer

```bash
pip install buildozer
```

### Step 6: Setup Android Build Environment

#### Install Java Development Kit (JDK)
```bash
# Ubuntu/Debian
sudo apt install openjdk-11-jdk

# macOS
brew install openjdk@11
```

#### Verify Java Installation
```bash
java -version
javac -version
```

### Step 7: Initialize Buildozer

```bash
buildozer init
```

This creates a `buildozer.spec` file (already included in the repository).

### Step 8: Download Vosk Model (Optional)

For offline voice recognition, download a Vosk model:

```bash
# Create models directory
mkdir -p models

# Download small English model (~40MB)
cd models
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
mv vosk-model-small-en-us-0.15 vosk-model-en-us-0.22
cd ..
```

## 🔨 Building the APK

### Debug Build (Development)

```bash
buildozer android debug
```

### Release Build (Production)

1. **Configure signing (optional):**
   Edit `buildozer.spec` and add your keystore information:
   ```ini
   [android.gradle_dependencies]
   android.gradle_repositories = google(), mavenCentral()
   
   [app]
   # Add signing configuration if needed
   ```

2. **Build release APK:**
   ```bash
   buildozer android release
   ```

## 📱 Installing on Android Device

### Enable Developer Options
1. Go to **Settings** > **About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings** > **Developer Options**
4. Enable **USB Debugging**

### Install APK
1. **Via USB:**
   ```bash
   adb install bin/jarvis-*.apk
   ```

2. **Via File Transfer:**
   - Copy APK to device storage
   - Use file manager to install
   - Enable "Install from unknown sources" when prompted

3. **Via Build Script:**
   ```bash
   ./build_apk.sh --install  # If device is connected via USB
   ```

## 🔧 Configuration

### Initial Setup
1. Launch JARVIS app
2. Grant required permissions:
   - Microphone access
   - Storage access
   - Camera access (optional)
3. Go to Settings tab to configure preferences

### Voice Recognition Setup
1. Ensure Vosk model is included in APK
2. Test microphone in Settings
3. Adjust wake word sensitivity
4. Configure speech rate and volume

### API Keys (Optional)
Add API keys for online features:
1. OpenAI API for advanced chat
2. Weather API for weather information
3. News API for news updates

## 🐛 Troubleshooting

### Common Build Issues

#### 1. Gradle Build Fails
```bash
# Clear gradle cache
rm -rf ~/.gradle/caches/
buildozer android clean
```

#### 2. NDK Not Found
```bash
# Let buildozer download NDK automatically
buildozer android debug
```

#### 3. Memory Issues
```bash
# Increase JVM memory
export GRADLE_OPTS="-Xmx4g -Dorg.gradle.jvmargs='-Xmx4g'"
```

#### 4. Permission Denied
```bash
# Fix file permissions
chmod -R 755 .buildozer/
```

### Runtime Issues

#### 1. Voice Recognition Not Working
- Check microphone permissions
- Verify Vosk model is included
- Test with device microphone app

#### 2. App Crashes on Startup
- Check device logs: `adb logcat | grep python`
- Verify all dependencies are included
- Check Android version compatibility

#### 3. Features Not Working
- Review app permissions
- Check network connectivity
- Verify API keys are configured

## 📊 Build Optimization

### Reduce APK Size
1. Use smaller Vosk models
2. Remove unused dependencies
3. Enable ProGuard/R8 optimization

### Improve Performance
1. Use release builds for distribution
2. Enable multidex if needed
3. Optimize images and resources

## 🔄 Updating JARVIS

### Update Code
```bash
git pull origin main
pip install -r requirements.txt
buildozer android debug
```

### Update Dependencies
```bash
pip install --upgrade -r requirements.txt
buildozer android clean
buildozer android debug
```

## 📞 Getting Help

### Build Issues
1. Check [buildozer documentation](https://buildozer.readthedocs.io/)
2. Review [python-for-android docs](https://python-for-android.readthedocs.io/)
3. Search existing [GitHub issues](https://github.com/jarvis-ai/jarvis-assistant/issues)

### App Issues
1. Enable debug logging
2. Check device logs
3. Create detailed issue report

## 🎯 Next Steps

After successful installation:
1. Explore available voice commands
2. Customize plugins in Settings
3. Set up API integrations
4. Create custom plugins
5. Join the community discussions

---

**🎉 Congratulations! You now have JARVIS running on your Android device!**
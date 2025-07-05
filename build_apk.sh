#!/bin/bash

# JARVIS AI Assistant - Android APK Build Script
# This script builds the JARVIS Android application

set -e  # Exit on any error

echo "🤖 JARVIS AI Assistant - Android Build Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    print_success "Python $python_version found"
    
    # Check if version is 3.8 or higher
    if python3 -c 'import sys; exit(1 if sys.version_info < (3, 8) else 0)'; then
        print_success "Python version is compatible"
    else
        print_error "Python 3.8 or higher is required. Found: $python_version"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing Python dependencies..."
    
    # Upgrade pip
    python3 -m pip install --upgrade pip
    
    # Install requirements
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
        print_success "Dependencies installed successfully"
    else
        print_error "requirements.txt not found"
        exit 1
    fi
}

# Setup buildozer
setup_buildozer() {
    print_status "Setting up Buildozer..."
    
    # Install buildozer if not already installed
    if ! command -v buildozer &> /dev/null; then
        print_status "Installing Buildozer..."
        pip3 install buildozer
    fi
    
    # Check if buildozer.spec exists
    if [ ! -f "buildozer.spec" ]; then
        print_status "Initializing Buildozer..."
        buildozer init
        print_warning "Buildozer initialized. You may need to edit buildozer.spec for your specific needs."
    fi
    
    print_success "Buildozer setup complete"
}

# Check Android dependencies
check_android_deps() {
    print_status "Checking Android build dependencies..."
    
    # Check for Java
    if ! command -v java &> /dev/null; then
        print_warning "Java not found. Install OpenJDK 8 or 11 for Android builds."
    fi
    
    # Check for Android SDK
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        print_warning "Android SDK not found. Buildozer will download it automatically."
    fi
    
    print_status "Android dependency check complete"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    directories=("data" "logs" "models" "plugins" "bin")
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        fi
    done
    
    print_success "Directories created"
}

# Download Vosk model (optional)
download_vosk_model() {
    print_status "Checking for Vosk speech recognition model..."
    
    model_dir="models/vosk-model-en-us-0.22"
    
    if [ ! -d "$model_dir" ]; then
        print_status "Vosk model not found. You can download it manually from:"
        print_status "https://alphacephei.com/vosk/models"
        print_warning "Voice recognition will not work without a Vosk model"
    else
        print_success "Vosk model found"
    fi
}

# Clean previous builds
clean_build() {
    print_status "Cleaning previous builds..."
    
    if command -v buildozer &> /dev/null; then
        buildozer android clean
        print_success "Build cache cleaned"
    fi
}

# Build debug APK
build_debug() {
    print_status "Building debug APK..."
    print_warning "This may take a while on first build (downloading Android SDK/NDK)..."
    
    if buildozer android debug; then
        print_success "Debug APK built successfully!"
        
        # Find and show APK location
        apk_file=$(find . -name "*.apk" -type f 2>/dev/null | head -1)
        if [ -n "$apk_file" ]; then
            print_success "APK location: $apk_file"
            file_size=$(du -h "$apk_file" | cut -f1)
            print_success "APK size: $file_size"
        fi
    else
        print_error "Build failed!"
        exit 1
    fi
}

# Build release APK
build_release() {
    print_status "Building release APK..."
    print_warning "Make sure you have configured signing keys in buildozer.spec"
    
    if buildozer android release; then
        print_success "Release APK built successfully!"
        
        # Find and show APK location
        apk_file=$(find . -name "*-release.apk" -type f 2>/dev/null | head -1)
        if [ -n "$apk_file" ]; then
            print_success "Release APK location: $apk_file"
            file_size=$(du -h "$apk_file" | cut -f1)
            print_success "APK size: $file_size"
        fi
    else
        print_error "Release build failed!"
        exit 1
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --debug     Build debug APK (default)"
    echo "  --release   Build release APK"
    echo "  --clean     Clean build cache before building"
    echo "  --setup     Only setup dependencies, don't build"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Build debug APK"
    echo "  $0 --debug        # Build debug APK"
    echo "  $0 --release      # Build release APK"
    echo "  $0 --clean --debug # Clean and build debug APK"
}

# Main function
main() {
    local build_type="debug"
    local clean_first=false
    local setup_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --debug)
                build_type="debug"
                shift
                ;;
            --release)
                build_type="release"
                shift
                ;;
            --clean)
                clean_first=true
                shift
                ;;
            --setup)
                setup_only=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_status "Starting JARVIS build process..."
    
    # Run setup steps
    check_python
    create_directories
    install_dependencies
    setup_buildozer
    check_android_deps
    download_vosk_model
    
    if [ "$setup_only" = true ]; then
        print_success "Setup completed successfully!"
        exit 0
    fi
    
    # Clean if requested
    if [ "$clean_first" = true ]; then
        clean_build
    fi
    
    # Build APK
    if [ "$build_type" = "release" ]; then
        build_release
    else
        build_debug
    fi
    
    print_success "🎉 JARVIS build process completed!"
    print_status "You can now install the APK on your Android device."
    print_status "Enable 'Install from unknown sources' in your device settings."
}

# Run main function with all arguments
main "$@"
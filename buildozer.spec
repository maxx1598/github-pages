[app]
# (str) Title of your application
title = JARVIS AI Assistant

# (str) Package name
package.name = jarvis

# (str) Package domain
package.domain = ai.jarvis

# (str) Source code where the main.py live
source.dir = .

# (list) Source files to include (let buildozer auto detect)
source.include_exts = py,png,jpg,kv,atlas,wav,mp3

# (str) Application versioning (method 1)
version = 1.0.0

# (list) Application requirements
requirements = python3,kivy>=2.1.0,kivymd>=1.1.1,pyjnius,plyer,android,requests,cryptography,pyttsx3,vosk,pyaudio,numpy,sounddevice,psutil,python-dateutil,jsonschema,openai,pint,nltk

# (str) Presplash of the application
#presplash.filename = %(source.dir)s/data/presplash.png

# (str) Icon of the application
#icon.filename = %(source.dir)s/data/icon.png

# (str) Supported orientation (one of landscape, sensorLandscape, portrait or sensorPortrait)
orientation = portrait

# (bool) Indicate if the application should be fullscreen or not
fullscreen = 0

[buildozer]
# (int) Log level (0 = error only, 1 = info, 2 = debug (with command output))
log_level = 2

# (int) Display warning if buildozer is run as root (0 = False, 1 = True)
warn_on_root = 1

[android]
# (list) Permissions
android.permissions = INTERNET,RECORD_AUDIO,WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE,MODIFY_AUDIO_SETTINGS,ACCESS_NETWORK_STATE,ACCESS_WIFI_STATE,CHANGE_WIFI_STATE,BLUETOOTH,BLUETOOTH_ADMIN,CAMERA,FLASHLIGHT,VIBRATE,WAKE_LOCK,SYSTEM_ALERT_WINDOW,WRITE_SETTINGS

# (int) Target Android API, should be as high as possible.
android.api = 33

# (int) Minimum API your APK will support.
android.minapi = 21

# (str) Android NDK version to use
android.ndk = 25b

# (str) Android SDK version to use
android.sdk = 33

# (bool) Enable AndroidX support. Enable when 'android.gradle_dependencies'
# contains an 'androidx' package, or any package from Kotlin source.
android.enable_androidx = True

# (str) Android entry point, default is ok for Kivy-based app
android.entrypoint = org.kivy.android.PythonActivity

# (str) Full name including package path of the Java class that implements Android Activity
# use that parameter together with android.entrypoint to set custom Java class instead of PythonActivity
#android.activity_class_name = org.kivy.android.PythonActivity

# (str) Extra xml to write directly inside the <manifest> element of AndroidManifest.xml
android.add_manifest_xml = <uses-feature android:name="android.hardware.microphone" android:required="true" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.flash" android:required="false" />

# (list) Java classes to add as activities to the manifest
#android.add_activities = com.example.ExampleActivity

# (str) python-for-android git clone directory (if empty, it will be automatically cloned from github)
#p4a.source_dir =

# (str) The directory in which python-for-android should look for your own build recipes (if any)
#p4a.local_recipes =

# (str) Filename to the hook for p4a
#p4a.hook =

# (str) Bootstrap to use for android builds
p4a.bootstrap = sdl2

# (int) port number to specify an explicit --port= p4a argument (eg: --port=9099)
#p4a.port =

# Control passing the --private-data-dir to p4a
#p4a.private_data_dir = True

# (str) Arguments that will be passed to ./configure
#p4a.configure_args =

# (bool) If True, builds will delete previous builds before starting
p4a.clean_builds = True

[buildozer:install]
# (str) Installation directory of buildozer
# directory = ~/.buildozer
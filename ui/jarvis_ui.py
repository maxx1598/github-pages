"""Main JARVIS UI interface using Kivy."""

import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.scrollview import ScrollView
from kivy.uix.popup import Popup
from kivy.uix.switch import Switch
from kivy.uix.slider import Slider
from kivy.uix.spinner import Spinner
from kivy.uix.progressbar import ProgressBar
from kivy.uix.tabbedpanel import TabbedPanel, TabbedPanelItem
from kivy.clock import Clock
from kivy.graphics import Color, RoundedRectangle
from kivy.metrics import dp
from kivy.utils import get_color_from_hex
from kivy.animation import Animation

logger = logging.getLogger(__name__)

class JarvisUI:
    """Main JARVIS user interface."""
    
    def __init__(self, jarvis_core):
        """Initialize JARVIS UI."""
        self.jarvis_core = jarvis_core
        self.main_layout = None
        self.chat_display = None
        self.input_field = None
        self.status_label = None
        self.voice_button = None
        self.conversation_history = []
        
        # UI state
        self.is_voice_mode = False
        self.theme = self.jarvis_core.config.get('theme', 'dark')
        
        # Colors based on theme
        self.colors = self._get_theme_colors()
        
        # Register for responses
        self.jarvis_core.add_response_callback(self._on_response)
        
        logger.info("JARVIS UI initialized")
    
    def _get_theme_colors(self) -> Dict[str, List[float]]:
        """Get color scheme based on theme."""
        if self.theme == 'dark':
            return {
                'background': [0.1, 0.1, 0.1, 1],
                'surface': [0.2, 0.2, 0.2, 1],
                'primary': [0.3, 0.6, 1.0, 1],
                'secondary': [0.8, 0.8, 0.8, 1],
                'accent': [0.0, 0.8, 0.4, 1],
                'text': [1.0, 1.0, 1.0, 1],
                'text_secondary': [0.7, 0.7, 0.7, 1],
                'error': [1.0, 0.3, 0.3, 1]
            }
        else:  # light theme
            return {
                'background': [0.95, 0.95, 0.95, 1],
                'surface': [1.0, 1.0, 1.0, 1],
                'primary': [0.2, 0.4, 0.8, 1],
                'secondary': [0.3, 0.3, 0.3, 1],
                'accent': [0.0, 0.6, 0.3, 1],
                'text': [0.1, 0.1, 0.1, 1],
                'text_secondary': [0.4, 0.4, 0.4, 1],
                'error': [0.8, 0.2, 0.2, 1]
            }
    
    def build_interface(self) -> BoxLayout:
        """Build the main interface."""
        # Main layout
        self.main_layout = BoxLayout(
            orientation='vertical',
            spacing=dp(5),
            padding=dp(10)
        )
        
        # Set background color
        with self.main_layout.canvas.before:
            Color(*self.colors['background'])
            self.bg_rect = RoundedRectangle(size=self.main_layout.size, pos=self.main_layout.pos)
        
        self.main_layout.bind(size=self._update_bg, pos=self._update_bg)
        
        # Create tabbed interface
        tabs = TabbedPanel(do_default_tab=False, tab_height=dp(50))
        
        # Chat tab
        chat_tab = TabbedPanelItem(text='Chat')
        chat_tab.content = self._build_chat_interface()
        tabs.add_widget(chat_tab)
        
        # Settings tab
        settings_tab = TabbedPanelItem(text='Settings')
        settings_tab.content = self._build_settings_interface()
        tabs.add_widget(settings_tab)
        
        # Status tab
        status_tab = TabbedPanelItem(text='Status')
        status_tab.content = self._build_status_interface()
        tabs.add_widget(status_tab)
        
        # Plugins tab
        plugins_tab = TabbedPanelItem(text='Plugins')
        plugins_tab.content = self._build_plugins_interface()
        tabs.add_widget(plugins_tab)
        
        # Set default tab
        tabs.default_tab_content = chat_tab.content
        
        self.main_layout.add_widget(tabs)
        
        # Start status updates
        Clock.schedule_interval(self._update_status, 1.0)
        
        return self.main_layout
    
    def _build_chat_interface(self) -> BoxLayout:
        """Build the chat interface."""
        layout = BoxLayout(orientation='vertical', spacing=dp(10))
        
        # Status bar
        status_layout = BoxLayout(size_hint_y=None, height=dp(40), spacing=dp(10))
        
        self.status_label = Label(
            text='JARVIS Ready',
            color=self.colors['text'],
            size_hint_x=0.7
        )
        status_layout.add_widget(self.status_label)
        
        # Voice mode toggle
        self.voice_button = Button(
            text='🎤 Voice',
            size_hint_x=0.3,
            background_color=self.colors['primary']
        )
        self.voice_button.bind(on_press=self._toggle_voice_mode)
        status_layout.add_widget(self.voice_button)
        
        layout.add_widget(status_layout)
        
        # Chat display (scrollable)
        scroll = ScrollView()
        self.chat_display = BoxLayout(
            orientation='vertical',
            spacing=dp(5),
            size_hint_y=None,
            padding=dp(10)
        )
        self.chat_display.bind(minimum_height=self.chat_display.setter('height'))
        
        # Chat background
        with self.chat_display.canvas.before:
            Color(*self.colors['surface'])
            self.chat_bg = RoundedRectangle(
                size=self.chat_display.size,
                pos=self.chat_display.pos,
                radius=[dp(10)]
            )
        
        self.chat_display.bind(size=self._update_chat_bg, pos=self._update_chat_bg)
        
        scroll.add_widget(self.chat_display)
        layout.add_widget(scroll)
        
        # Input area
        input_layout = BoxLayout(size_hint_y=None, height=dp(50), spacing=dp(10))
        
        self.input_field = TextInput(
            hint_text='Type your message here...',
            multiline=False,
            size_hint_x=0.8,
            background_color=self.colors['surface'],
            foreground_color=self.colors['text']
        )
        self.input_field.bind(on_text_validate=self._send_message)
        input_layout.add_widget(self.input_field)
        
        send_button = Button(
            text='Send',
            size_hint_x=0.2,
            background_color=self.colors['primary']
        )
        send_button.bind(on_press=self._send_message)
        input_layout.add_widget(send_button)
        
        layout.add_widget(input_layout)
        
        # Add welcome message
        self._add_message("Hello! I'm JARVIS, your AI assistant. How can I help you today?", 'assistant')
        
        return layout
    
    def _build_settings_interface(self) -> ScrollView:
        """Build the settings interface."""
        scroll = ScrollView()
        layout = BoxLayout(orientation='vertical', spacing=dp(20), size_hint_y=None, padding=dp(20))
        layout.bind(minimum_height=layout.setter('height'))
        
        # Voice Settings
        voice_section = self._create_section("Voice Settings")
        layout.add_widget(voice_section)
        
        # Voice Recognition Enable/Disable
        voice_enable_layout = BoxLayout(size_hint_y=None, height=dp(40))
        voice_enable_layout.add_widget(Label(text='Voice Recognition:', color=self.colors['text']))
        voice_switch = Switch(active=self.jarvis_core.config.get('voice_recognition_enabled', True))
        voice_switch.bind(active=self._on_voice_enable_change)
        voice_enable_layout.add_widget(voice_switch)
        layout.add_widget(voice_enable_layout)
        
        # TTS Settings
        tts_section = self._create_section("Text-to-Speech Settings")
        layout.add_widget(tts_section)
        
        # TTS Rate
        rate_layout = BoxLayout(size_hint_y=None, height=dp(60), orientation='vertical')
        rate_layout.add_widget(Label(
            text=f"Speech Rate: {self.jarvis_core.config.get('tts_rate', 150)} WPM",
            color=self.colors['text'],
            size_hint_y=None,
            height=dp(30)
        ))
        rate_slider = Slider(
            min=50, max=300,
            value=self.jarvis_core.config.get('tts_rate', 150),
            step=10
        )
        rate_slider.bind(value=self._on_tts_rate_change)
        rate_layout.add_widget(rate_slider)
        layout.add_widget(rate_layout)
        
        # Privacy Settings
        privacy_section = self._create_section("Privacy Settings")
        layout.add_widget(privacy_section)
        
        # Store Conversations
        store_conv_layout = BoxLayout(size_hint_y=None, height=dp(40))
        store_conv_layout.add_widget(Label(text='Store Conversations:', color=self.colors['text']))
        store_switch = Switch(active=self.jarvis_core.config.get('store_conversations', False))
        store_switch.bind(active=self._on_store_conversations_change)
        store_conv_layout.add_widget(store_switch)
        layout.add_widget(store_conv_layout)
        
        # Theme Settings
        theme_section = self._create_section("Appearance")
        layout.add_widget(theme_section)
        
        # Theme Selector
        theme_layout = BoxLayout(size_hint_y=None, height=dp(40))
        theme_layout.add_widget(Label(text='Theme:', color=self.colors['text']))
        theme_spinner = Spinner(
            text=self.theme.title(),
            values=['Dark', 'Light'],
            size_hint_x=0.5
        )
        theme_spinner.bind(text=self._on_theme_change)
        theme_layout.add_widget(theme_spinner)
        layout.add_widget(theme_layout)
        
        scroll.add_widget(layout)
        return scroll
    
    def _build_status_interface(self) -> ScrollView:
        """Build the status interface."""
        scroll = ScrollView()
        self.status_layout = BoxLayout(orientation='vertical', spacing=dp(15), size_hint_y=None, padding=dp(20))
        self.status_layout.bind(minimum_height=self.status_layout.setter('height'))
        
        # System Status
        status_section = self._create_section("System Status")
        self.status_layout.add_widget(status_section)
        
        self.system_status_labels = {}
        status_items = [
            'Voice Recognition', 'Text-to-Speech', 'Plugins Loaded',
            'Commands Processed', 'Wake Words Detected', 'Errors'
        ]
        
        for item in status_items:
            item_layout = BoxLayout(size_hint_y=None, height=dp(30))
            item_layout.add_widget(Label(text=f'{item}:', color=self.colors['text'], size_hint_x=0.6))
            status_label = Label(text='Loading...', color=self.colors['text_secondary'], size_hint_x=0.4)
            self.system_status_labels[item] = status_label
            item_layout.add_widget(status_label)
            self.status_layout.add_widget(item_layout)
        
        # Performance Metrics
        perf_section = self._create_section("Performance")
        self.status_layout.add_widget(perf_section)
        
        # Add progress bars for system metrics
        self.performance_bars = {}
        perf_items = ['CPU Usage', 'Memory Usage', 'Response Time']
        
        for item in perf_items:
            item_layout = BoxLayout(size_hint_y=None, height=dp(50), orientation='vertical')
            item_layout.add_widget(Label(
                text=item,
                color=self.colors['text'],
                size_hint_y=None,
                height=dp(25)
            ))
            progress_bar = ProgressBar(max=100, value=0, size_hint_y=None, height=dp(20))
            self.performance_bars[item] = progress_bar
            item_layout.add_widget(progress_bar)
            self.status_layout.add_widget(item_layout)
        
        scroll.add_widget(self.status_layout)
        return scroll
    
    def _build_plugins_interface(self) -> ScrollView:
        """Build the plugins interface."""
        scroll = ScrollView()
        layout = BoxLayout(orientation='vertical', spacing=dp(15), size_hint_y=None, padding=dp(20))
        layout.bind(minimum_height=layout.setter('height'))
        
        # Plugins Header
        plugins_section = self._create_section("Available Plugins")
        layout.add_widget(plugins_section)
        
        # Plugin list
        self.plugins_layout = BoxLayout(orientation='vertical', size_hint_y=None, spacing=dp(10))
        self.plugins_layout.bind(minimum_height=self.plugins_layout.setter('height'))
        
        self._update_plugins_list()
        
        layout.add_widget(self.plugins_layout)
        
        scroll.add_widget(layout)
        return scroll
    
    def _create_section(self, title: str) -> Label:
        """Create a section header."""
        section_label = Label(
            text=title,
            color=self.colors['primary'],
            font_size='18sp',
            size_hint_y=None,
            height=dp(40),
            halign='left'
        )
        section_label.bind(size=section_label.setter('text_size'))
        return section_label
    
    def _update_plugins_list(self):
        """Update the plugins list display."""
        self.plugins_layout.clear_widgets()
        
        available_plugins = self.jarvis_core.get_available_plugins()
        
        for plugin_name in available_plugins:
            plugin_info = self.jarvis_core.plugin_manager.get_plugin_info(plugin_name)
            if plugin_info:
                plugin_layout = BoxLayout(size_hint_y=None, height=dp(60), spacing=dp(10))
                
                # Plugin info
                info_layout = BoxLayout(orientation='vertical', size_hint_x=0.7)
                info_layout.add_widget(Label(
                    text=plugin_name.replace('_', ' ').title(),
                    color=self.colors['text'],
                    size_hint_y=None,
                    height=dp(30),
                    halign='left'
                ))
                info_layout.add_widget(Label(
                    text=plugin_info['help'],
                    color=self.colors['text_secondary'],
                    font_size='12sp',
                    size_hint_y=None,
                    height=dp(30),
                    halign='left'
                ))
                plugin_layout.add_widget(info_layout)
                
                # Enable/Disable switch
                plugin_switch = Switch(active=plugin_info['enabled'])
                plugin_switch.bind(active=lambda switch, value, name=plugin_name: self._on_plugin_toggle(name, value))
                plugin_layout.add_widget(plugin_switch)
                
                self.plugins_layout.add_widget(plugin_layout)
    
    def _add_message(self, message: str, sender: str):
        """Add a message to the chat display."""
        message_layout = BoxLayout(
            size_hint_y=None,
            height=dp(60),
            padding=dp(10),
            spacing=dp(10)
        )
        
        # Message bubble
        bubble_color = self.colors['primary'] if sender == 'user' else self.colors['surface']
        text_color = self.colors['text']
        
        message_label = Label(
            text=message,
            color=text_color,
            text_size=(None, None),
            halign='left',
            valign='middle'
        )
        
        # Set text size for wrapping
        def update_text_size(instance, value):
            instance.text_size = (value[0] - dp(40), None)
            instance.height = max(dp(40), instance.texture_size[1] + dp(20))
            message_layout.height = instance.height + dp(20)
        
        message_label.bind(size=update_text_size)
        
        # Create bubble background
        with message_layout.canvas.before:
            Color(*bubble_color)
            bubble_rect = RoundedRectangle(
                size=message_layout.size,
                pos=message_layout.pos,
                radius=[dp(15)]
            )
        
        def update_bubble(instance, value):
            bubble_rect.size = instance.size
            bubble_rect.pos = instance.pos
        
        message_layout.bind(size=update_bubble, pos=update_bubble)
        
        # Add sender indicator
        sender_label = Label(
            text=f"{'You' if sender == 'user' else 'JARVIS'}:",
            color=self.colors['text_secondary'],
            font_size='12sp',
            size_hint_x=None,
            width=dp(60),
            halign='left'
        )
        
        message_layout.add_widget(sender_label)
        message_layout.add_widget(message_label)
        
        self.chat_display.add_widget(message_layout)
        
        # Auto-scroll to bottom
        Clock.schedule_once(lambda dt: self._scroll_to_bottom(), 0.1)
    
    def _scroll_to_bottom(self):
        """Scroll chat to bottom."""
        if hasattr(self.chat_display.parent, 'scroll_y'):
            self.chat_display.parent.scroll_y = 0
    
    def _send_message(self, instance=None):
        """Send a message."""
        message = self.input_field.text.strip()
        if not message:
            return
        
        # Add user message to chat
        self._add_message(message, 'user')
        
        # Clear input field
        self.input_field.text = ''
        
        # Process command
        self.jarvis_core.process_command(message, source='text')
    
    def _toggle_voice_mode(self, instance):
        """Toggle voice mode."""
        self.is_voice_mode = not self.is_voice_mode
        
        if self.is_voice_mode:
            self.voice_button.text = '🔴 Stop'
            self.voice_button.background_color = self.colors['error']
            self.jarvis_core.start_voice_recognition()
        else:
            self.voice_button.text = '🎤 Voice'
            self.voice_button.background_color = self.colors['primary']
            self.jarvis_core.stop_voice_recognition()
    
    def _on_response(self, command: str, response: str, source: str):
        """Handle response from JARVIS core."""
        Clock.schedule_once(lambda dt: self._add_message(response, 'assistant'), 0)
    
    def _update_status(self, dt):
        """Update status display."""
        status = self.jarvis_core.get_status()
        
        # Update status label
        if status['listening']:
            self.status_label.text = '🎤 Listening...'
            self.status_label.color = self.colors['accent']
        elif status['processing']:
            self.status_label.text = '🤔 Processing...'
            self.status_label.color = self.colors['primary']
        elif status['speaking']:
            self.status_label.text = '🗣️ Speaking...'
            self.status_label.color = self.colors['accent']
        else:
            self.status_label.text = '✅ Ready'
            self.status_label.color = self.colors['text']
        
        # Update system status if on status tab
        if hasattr(self, 'system_status_labels'):
            self.system_status_labels['Voice Recognition'].text = '✅' if status['voice_available'] else '❌'
            self.system_status_labels['Text-to-Speech'].text = '✅' if status['tts_available'] else '❌'
            self.system_status_labels['Plugins Loaded'].text = str(status['plugins_loaded'])
            self.system_status_labels['Commands Processed'].text = str(status['stats']['commands_processed'])
            self.system_status_labels['Wake Words Detected'].text = str(status['stats']['wake_words_detected'])
            self.system_status_labels['Errors'].text = str(status['stats']['errors'])
        
        # Update performance bars (mock data for now)
        if hasattr(self, 'performance_bars'):
            import random
            self.performance_bars['CPU Usage'].value = random.randint(10, 50)
            self.performance_bars['Memory Usage'].value = random.randint(20, 60)
            self.performance_bars['Response Time'].value = random.randint(5, 25)
    
    def _on_voice_enable_change(self, instance, value):
        """Handle voice recognition enable/disable."""
        self.jarvis_core.config.set('voice_recognition_enabled', value)
        if value:
            self.jarvis_core.voice_recognition.initialize()
        else:
            self.jarvis_core.stop_voice_recognition()
    
    def _on_tts_rate_change(self, instance, value):
        """Handle TTS rate change."""
        self.jarvis_core.config.set('tts_rate', int(value))
        self.jarvis_core.tts.set_rate(int(value))
        
        # Update label
        for widget in instance.parent.children:
            if isinstance(widget, Label) and 'Speech Rate' in widget.text:
                widget.text = f"Speech Rate: {int(value)} WPM"
    
    def _on_store_conversations_change(self, instance, value):
        """Handle store conversations setting change."""
        if value:
            self.jarvis_core.conversation_manager.enable_storage()
        else:
            self.jarvis_core.conversation_manager.disable_storage()
    
    def _on_theme_change(self, instance, text):
        """Handle theme change."""
        self.theme = text.lower()
        self.jarvis_core.config.set('theme', self.theme)
        self.colors = self._get_theme_colors()
        # Note: Full UI refresh would be needed for complete theme change
    
    def _on_plugin_toggle(self, plugin_name: str, enabled: bool):
        """Handle plugin enable/disable."""
        if enabled:
            self.jarvis_core.enable_plugin(plugin_name)
        else:
            self.jarvis_core.disable_plugin(plugin_name)
    
    def _update_bg(self, instance, value):
        """Update background rectangle."""
        self.bg_rect.size = instance.size
        self.bg_rect.pos = instance.pos
    
    def _update_chat_bg(self, instance, value):
        """Update chat background rectangle."""
        self.chat_bg.size = instance.size
        self.chat_bg.pos = instance.pos
    
    def show_popup(self, title: str, message: str):
        """Show a popup message."""
        popup_layout = BoxLayout(orientation='vertical', spacing=dp(10), padding=dp(20))
        
        popup_layout.add_widget(Label(
            text=message,
            color=self.colors['text'],
            text_size=(dp(300), None),
            halign='center'
        ))
        
        close_button = Button(
            text='Close',
            size_hint_y=None,
            height=dp(40),
            background_color=self.colors['primary']
        )
        
        popup = Popup(
            title=title,
            content=popup_layout,
            size_hint=(0.8, 0.6),
            auto_dismiss=True
        )
        
        close_button.bind(on_press=popup.dismiss)
        popup_layout.add_widget(close_button)
        
        popup.open()
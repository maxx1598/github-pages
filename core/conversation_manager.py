"""Conversation manager for handling chat history and context."""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional

from .config import Config
from .security import SecurityManager

logger = logging.getLogger(__name__)

class ConversationManager:
    """Manages conversation history and context."""
    
    def __init__(self, config: Config, security_manager: SecurityManager):
        """Initialize conversation manager."""
        self.config = config
        self.security_manager = security_manager
        
        self.conversation_file = Path("data/conversation_history.json")
        self.conversation_history: List[Dict[str, Any]] = []
        
        self.max_history = config.get('max_conversation_history', 100)
        self.store_conversations = config.get('store_conversations', False)
        self.auto_delete_logs = config.get('auto_delete_logs', True)
        self.retention_days = config.get('log_retention_days', 7)
        
        logger.info("Conversation manager initialized")
    
    def initialize(self):
        """Initialize conversation manager and load history."""
        if self.store_conversations:
            self._load_conversation_history()
        
        # Clean up old conversations if auto-delete is enabled
        if self.auto_delete_logs:
            self._cleanup_old_conversations()
    
    def add_user_message(self, message: str):
        """Add a user message to the conversation history."""
        if not self.store_conversations:
            return
        
        conversation_entry = {
            'type': 'user',
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'message_id': self._generate_message_id()
        }
        
        self.conversation_history.append(conversation_entry)
        self._trim_history()
        self._save_conversation_history()
        
        logger.debug(f"Added user message: {message[:50]}...")
    
    def add_assistant_message(self, message: str):
        """Add an assistant message to the conversation history."""
        if not self.store_conversations:
            return
        
        conversation_entry = {
            'type': 'assistant',
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'message_id': self._generate_message_id()
        }
        
        self.conversation_history.append(conversation_entry)
        self._trim_history()
        self._save_conversation_history()
        
        logger.debug(f"Added assistant message: {message[:50]}...")
    
    def add_system_message(self, message: str):
        """Add a system message to the conversation history."""
        if not self.store_conversations:
            return
        
        conversation_entry = {
            'type': 'system',
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'message_id': self._generate_message_id()
        }
        
        self.conversation_history.append(conversation_entry)
        self._trim_history()
        self._save_conversation_history()
        
        logger.debug(f"Added system message: {message[:50]}...")
    
    def get_history(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get conversation history."""
        if limit:
            return self.conversation_history[-limit:]
        return self.conversation_history.copy()
    
    def get_recent_context(self, turns: int = 5) -> str:
        """Get recent conversation context as a formatted string."""
        recent_messages = self.conversation_history[-turns*2:] if self.conversation_history else []
        
        context_parts = []
        for entry in recent_messages:
            role = entry['type'].title()
            message = entry['message']
            context_parts.append(f"{role}: {message}")
        
        return "\n".join(context_parts)
    
    def search_history(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search conversation history for messages containing the query."""
        query_lower = query.lower()
        matches = []
        
        for entry in self.conversation_history:
            if query_lower in entry['message'].lower():
                matches.append(entry)
                if len(matches) >= limit:
                    break
        
        return matches
    
    def get_conversation_stats(self) -> Dict[str, Any]:
        """Get conversation statistics."""
        total_messages = len(self.conversation_history)
        user_messages = len([m for m in self.conversation_history if m['type'] == 'user'])
        assistant_messages = len([m for m in self.conversation_history if m['type'] == 'assistant'])
        system_messages = len([m for m in self.conversation_history if m['type'] == 'system'])
        
        # Calculate time span
        if self.conversation_history:
            first_message = datetime.fromisoformat(self.conversation_history[0]['timestamp'])
            last_message = datetime.fromisoformat(self.conversation_history[-1]['timestamp'])
            time_span = last_message - first_message
        else:
            time_span = timedelta(0)
        
        return {
            'total_messages': total_messages,
            'user_messages': user_messages,
            'assistant_messages': assistant_messages,
            'system_messages': system_messages,
            'time_span_hours': time_span.total_seconds() / 3600,
            'storage_enabled': self.store_conversations,
            'file_size_bytes': self.conversation_file.stat().st_size if self.conversation_file.exists() else 0
        }
    
    def export_conversation(self, format: str = 'json') -> str:
        """Export conversation history in the specified format."""
        if format.lower() == 'json':
            return json.dumps(self.conversation_history, indent=2)
        
        elif format.lower() == 'text':
            lines = []
            for entry in self.conversation_history:
                timestamp = datetime.fromisoformat(entry['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
                role = entry['type'].title()
                message = entry['message']
                lines.append(f"[{timestamp}] {role}: {message}")
            return "\n".join(lines)
        
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    def import_conversation(self, data: str, format: str = 'json'):
        """Import conversation history from the specified format."""
        if format.lower() == 'json':
            imported_data = json.loads(data)
            
            # Validate the data structure
            for entry in imported_data:
                if not all(key in entry for key in ['type', 'message', 'timestamp']):
                    raise ValueError("Invalid conversation data format")
            
            self.conversation_history.extend(imported_data)
            self._trim_history()
            self._save_conversation_history()
        
        else:
            raise ValueError(f"Unsupported import format: {format}")
    
    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history.clear()
        
        # Securely delete the conversation file if it exists
        if self.conversation_file.exists():
            self.security_manager.secure_delete_file(self.conversation_file)
        
        logger.info("Conversation history cleared")
    
    def enable_storage(self):
        """Enable conversation storage."""
        self.store_conversations = True
        self.config.set('store_conversations', True)
        logger.info("Conversation storage enabled")
    
    def disable_storage(self):
        """Disable conversation storage and clear existing history."""
        self.store_conversations = False
        self.config.set('store_conversations', False)
        self.clear_history()
        logger.info("Conversation storage disabled")
    
    def _load_conversation_history(self):
        """Load conversation history from file."""
        if not self.conversation_file.exists():
            return
        
        try:
            # Check if encryption is enabled
            if self.config.get('data_encryption', True):
                with open(self.conversation_file, 'rb') as f:
                    encrypted_data = f.read()
                
                decrypted_data = self.security_manager.decrypt_data(encrypted_data)
                self.conversation_history = json.loads(decrypted_data)
            else:
                with open(self.conversation_file, 'r') as f:
                    self.conversation_history = json.load(f)
            
            logger.info(f"Loaded {len(self.conversation_history)} conversation entries")
        
        except Exception as e:
            logger.error(f"Error loading conversation history: {e}")
            self.conversation_history = []
    
    def _save_conversation_history(self):
        """Save conversation history to file."""
        if not self.store_conversations:
            return
        
        try:
            # Ensure data directory exists
            self.conversation_file.parent.mkdir(exist_ok=True)
            
            # Check if encryption is enabled
            if self.config.get('data_encryption', True):
                encrypted_data = self.security_manager.encrypt_data(self.conversation_history)
                with open(self.conversation_file, 'wb') as f:
                    f.write(encrypted_data)
            else:
                with open(self.conversation_file, 'w') as f:
                    json.dump(self.conversation_history, f, indent=2)
            
            logger.debug("Conversation history saved")
        
        except Exception as e:
            logger.error(f"Error saving conversation history: {e}")
    
    def _trim_history(self):
        """Trim conversation history to maximum length."""
        if len(self.conversation_history) > self.max_history:
            # Keep the most recent messages
            self.conversation_history = self.conversation_history[-self.max_history:]
            logger.debug(f"Trimmed conversation history to {self.max_history} messages")
    
    def _cleanup_old_conversations(self):
        """Clean up old conversation entries."""
        if not self.conversation_history:
            return
        
        cutoff_date = datetime.now() - timedelta(days=self.retention_days)
        
        # Filter out old messages
        filtered_history = []
        for entry in self.conversation_history:
            entry_date = datetime.fromisoformat(entry['timestamp'])
            if entry_date > cutoff_date:
                filtered_history.append(entry)
        
        removed_count = len(self.conversation_history) - len(filtered_history)
        if removed_count > 0:
            self.conversation_history = filtered_history
            self._save_conversation_history()
            logger.info(f"Cleaned up {removed_count} old conversation entries")
    
    def _generate_message_id(self) -> str:
        """Generate a unique message ID."""
        import uuid
        return str(uuid.uuid4())
    
    def save_history(self):
        """Explicitly save conversation history."""
        if self.store_conversations:
            self._save_conversation_history()
    
    def get_user_preferences(self) -> Dict[str, Any]:
        """Analyze conversation history to extract user preferences."""
        preferences = {
            'common_topics': [],
            'preferred_response_style': 'neutral',
            'active_times': [],
            'command_frequency': {}
        }
        
        if not self.conversation_history:
            return preferences
        
        # Analyze message patterns
        user_messages = [m for m in self.conversation_history if m['type'] == 'user']
        
        # Count command frequencies
        command_counts = {}
        for message in user_messages:
            # Extract potential commands (first few words)
            words = message['message'].lower().split()[:3]
            command = ' '.join(words)
            command_counts[command] = command_counts.get(command, 0) + 1
        
        # Get most frequent commands
        preferences['command_frequency'] = dict(sorted(
            command_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:10])
        
        # Analyze active times
        active_hours = []
        for message in user_messages:
            timestamp = datetime.fromisoformat(message['timestamp'])
            active_hours.append(timestamp.hour)
        
        if active_hours:
            from collections import Counter
            hour_counts = Counter(active_hours)
            preferences['active_times'] = [hour for hour, count in hour_counts.most_common(3)]
        
        return preferences
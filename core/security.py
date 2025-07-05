"""Security and privacy management for JARVIS."""

import os
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

class SecurityManager:
    """Manages security, encryption, and privacy for JARVIS."""
    
    def __init__(self, data_dir: str = "data"):
        """Initialize security manager."""
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        self.key_file = self.data_dir / "security.key"
        self.user_data_file = self.data_dir / "user_data.enc"
        
        self.encryption_key = self._get_or_create_key()
        self.cipher = Fernet(self.encryption_key)
    
    def _get_or_create_key(self) -> bytes:
        """Get existing encryption key or create a new one."""
        if self.key_file.exists():
            with open(self.key_file, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            with open(self.key_file, 'wb') as f:
                f.write(key)
            # Set restrictive permissions
            os.chmod(self.key_file, 0o600)
            return key
    
    def _derive_key_from_password(self, password: str, salt: bytes = None) -> bytes:
        """Derive encryption key from password."""
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key, salt
    
    def encrypt_data(self, data: Any) -> bytes:
        """Encrypt data using Fernet encryption."""
        if isinstance(data, dict) or isinstance(data, list):
            data = json.dumps(data)
        elif not isinstance(data, str):
            data = str(data)
        
        return self.cipher.encrypt(data.encode())
    
    def decrypt_data(self, encrypted_data: bytes) -> str:
        """Decrypt data using Fernet encryption."""
        try:
            decrypted = self.cipher.decrypt(encrypted_data)
            return decrypted.decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt data: {e}")
    
    def hash_data(self, data: str) -> str:
        """Create SHA-256 hash of data."""
        return hashlib.sha256(data.encode()).hexdigest()
    
    def store_user_data(self, data: Dict[str, Any]):
        """Store encrypted user data."""
        encrypted_data = self.encrypt_data(data)
        with open(self.user_data_file, 'wb') as f:
            f.write(encrypted_data)
        os.chmod(self.user_data_file, 0o600)
    
    def load_user_data(self) -> Dict[str, Any]:
        """Load and decrypt user data."""
        if not self.user_data_file.exists():
            return {}
        
        try:
            with open(self.user_data_file, 'rb') as f:
                encrypted_data = f.read()
            
            decrypted_data = self.decrypt_data(encrypted_data)
            return json.loads(decrypted_data)
        except Exception as e:
            print(f"Error loading user data: {e}")
            return {}
    
    def secure_delete_file(self, file_path: Path):
        """Securely delete a file by overwriting it."""
        if file_path.exists():
            # Overwrite file with random data
            file_size = file_path.stat().st_size
            with open(file_path, 'wb') as f:
                f.write(os.urandom(file_size))
            # Delete the file
            file_path.unlink()
    
    def get_privacy_summary(self) -> Dict[str, Any]:
        """Get privacy and security status summary."""
        return {
            "encryption_enabled": True,
            "key_file_exists": self.key_file.exists(),
            "user_data_encrypted": self.user_data_file.exists(),
            "key_file_permissions": oct(os.stat(self.key_file).st_mode)[-3:] if self.key_file.exists() else None,
            "data_directory": str(self.data_dir),
            "security_level": "high"
        }
    
    def sanitize_input(self, user_input: str) -> str:
        """Sanitize user input to prevent injection attacks."""
        # Remove potential harmful characters
        dangerous_chars = ['<', '>', '&', '"', "'", ';', '|', '`', '$']
        sanitized = user_input
        
        for char in dangerous_chars:
            sanitized = sanitized.replace(char, '')
        
        return sanitized.strip()
    
    def validate_api_key(self, api_key: str) -> bool:
        """Validate API key format."""
        if not api_key or len(api_key) < 10:
            return False
        
        # Basic validation - should be alphanumeric with possible dashes/underscores
        import re
        pattern = r'^[a-zA-Z0-9_-]+$'
        return bool(re.match(pattern, api_key))
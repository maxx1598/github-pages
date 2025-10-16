import { format, formatDistanceToNow } from 'date-fns';

// Format date for display
export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return format(dateObj, 'MMM dd, yyyy');
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validate file types for uploads
export const isValidFileType = (file) => {
  const allowedTypes = [
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'application/zip',
    'text/plain'
  ];
  return allowedTypes.includes(file.type);
};

// Check if file size is within limit (50MB)
export const isValidFileSize = (file, maxSizeMB = 50) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Extract file extension
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Generate project URL slug
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check if user is admin
export const isAdmin = (user) => {
  return user?.email === process.env.REACT_APP_ADMIN_EMAIL || user?.isAdmin === true;
};

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Color palette for project categories
export const getCategoryColor = (category) => {
  const colors = {
    web: 'bg-blue-500',
    game: 'bg-purple-500',
    app: 'bg-green-500',
    tool: 'bg-orange-500',
    other: 'bg-gray-500'
  };
  return colors[category] || colors.other;
};

// Generate avatar URL based on username
export const generateAvatarUrl = (username) => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=3b82f6,8b5cf6,ef4444,f59e0b,10b981&textColor=ffffff`;
};
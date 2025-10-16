import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw,
  Maximize,
  Minimize
} from 'lucide-react';
import { createSafeIframeContent } from '../utils/sanitizer';

const ProjectPreviewIframe = ({ 
  content, 
  projectUrl, 
  title = 'Project Preview',
  showControls = true,
  className = ''
}) => {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (content && iframeRef.current) {
      loadContentIntoIframe();
    } else if (projectUrl && iframeRef.current) {
      loadUrlIntoIframe();
    }
  }, [content, projectUrl]);

  const loadContentIntoIframe = () => {
    try {
      setLoading(true);
      setError(null);

      const iframe = iframeRef.current;
      const safeContent = createSafeIframeContent(
        content.html || '',
        content.css || '',
        content.js || ''
      );

      // Create blob URL for the content
      const blob = new Blob([safeContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);

      iframe.src = blobUrl;

      // Clean up blob URL after iframe loads
      iframe.onload = () => {
        URL.revokeObjectURL(blobUrl);
        setLoading(false);
      };

      iframe.onerror = () => {
        setError('Failed to load preview');
        setLoading(false);
      };

    } catch (err) {
      console.error('Error loading content into iframe:', err);
      setError('Failed to create preview');
      setLoading(false);
    }
  };

  const loadUrlIntoIframe = () => {
    try {
      setLoading(true);
      setError(null);

      const iframe = iframeRef.current;
      iframe.src = projectUrl;

      iframe.onload = () => {
        setLoading(false);
      };

      iframe.onerror = () => {
        setError('Failed to load project');
        setLoading(false);
      };

    } catch (err) {
      console.error('Error loading URL into iframe:', err);
      setError('Failed to load project');
      setLoading(false);
    }
  };

  const refreshPreview = () => {
    if (content) {
      loadContentIntoIframe();
    } else if (projectUrl) {
      loadUrlIntoIframe();
    }
  };

  const openInNewTab = () => {
    if (projectUrl) {
      window.open(projectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Preview Error
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error}
          </p>
          <button
            onClick={refreshPreview}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Controls */}
      {showControls && (
        <div className="absolute top-2 right-2 z-10 flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshPreview}
            className="bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 p-2 rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>

          {projectUrl && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openInNewTab}
              className="bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 p-2 rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFullscreen}
            className="bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 p-2 rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </motion.button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading preview...</p>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        title={title}
        className={`w-full h-full border-0 ${
          isFullscreen 
            ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' 
            : ''
        }`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        loading="lazy"
        style={{
          colorScheme: 'light dark'
        }}
      />

      {/* Security Notice */}
      <div className="absolute bottom-2 left-2 z-10">
        <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3" />
          <span>Sandboxed Preview</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectPreviewIframe;
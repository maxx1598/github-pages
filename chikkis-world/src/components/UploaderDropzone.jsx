import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Image,
  Archive,
  Code
} from 'lucide-react';
import { isValidFileType, isValidFileSize, formatFileSize, getFileExtension } from '../utils/helpers';

const UploaderDropzone = ({ onFilesChange, maxFiles = 10, acceptedTypes = null }) => {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const getFileIcon = (file) => {
    const extension = getFileExtension(file.name);
    
    switch (extension) {
      case 'html':
      case 'css':
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return Code;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return Image;
      case 'zip':
      case 'rar':
      case '7z':
        return Archive;
      default:
        return FileText;
    }
  };

  const validateFile = (file) => {
    const errors = [];
    
    if (!isValidFileType(file)) {
      errors.push('File type not supported');
    }
    
    if (!isValidFileSize(file)) {
      errors.push('File size exceeds 50MB limit');
    }
    
    return errors;
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const newErrors = [];
    const validFiles = [];

    // Process accepted files
    acceptedFiles.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'ready'
        });
      } else {
        newErrors.push({
          file: file.name,
          errors: fileErrors
        });
      }
    });

    // Process rejected files
    rejectedFiles.forEach(rejection => {
      newErrors.push({
        file: rejection.file.name,
        errors: rejection.errors.map(error => error.message)
      });
    });

    // Check total file count
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > maxFiles) {
      newErrors.push({
        file: 'Multiple files',
        errors: [`Maximum ${maxFiles} files allowed`]
      });
      return;
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    setErrors(newErrors);
    onFilesChange(updatedFiles);
  }, [files, maxFiles, onFilesChange]);

  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setErrors([]);
    onFilesChange([]);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedTypes || {
      'text/html': ['.html', '.htm'],
      'text/css': ['.css'],
      'text/javascript': ['.js'],
      'application/javascript': ['.js'],
      'text/typescript': ['.ts'],
      'application/typescript': ['.ts'],
      'text/jsx': ['.jsx'],
      'text/tsx': ['.tsx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/svg+xml': ['.svg'],
      'application/zip': ['.zip'],
      'text/plain': ['.txt', '.md']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  return (
    <div className="w-full">
      {/* Dropzone */}
      <motion.div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive && !isDragReject 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : isDragReject 
            ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />
        
        <motion.div
          animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${
            isDragActive && !isDragReject 
              ? 'text-blue-500' 
              : isDragReject 
              ? 'text-red-500'
              : 'text-gray-400'
          }`} />
        </motion.div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isDragActive 
            ? isDragReject 
              ? 'Some files are not supported'
              : 'Drop files here'
            : 'Upload your project files'
          }
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Drag and drop files here, or click to browse
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Supported: HTML, CSS, JS, TS, Images, ZIP files (max 50MB each, {maxFiles} files total)
        </p>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Files ({files.length}/{maxFiles})
              </h4>
              <button
                onClick={clearAllFiles}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
            
            <div className="space-y-2">
              {files.map((fileItem) => {
                const FileIcon = getFileIcon(fileItem.file);
                
                return (
                  <motion.div
                    key={fileItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {fileItem.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(fileItem.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h5 className="font-medium text-red-800 dark:text-red-200">
                  Upload Errors
                </h5>
              </div>
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-700 dark:text-red-300">
                    <strong>{error.file}:</strong> {error.errors.join(', ')}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setErrors([])}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploaderDropzone;
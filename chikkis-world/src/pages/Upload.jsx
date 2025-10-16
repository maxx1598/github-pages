import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload as UploadIcon, 
  Save, 
  Eye, 
  Globe, 
  Lock, 
  Tag,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import { generateId, generateSlug } from '../utils/helpers';
import UploaderDropzone from '../components/UploaderDropzone';
import ProjectPreviewIframe from '../components/ProjectPreviewIframe';
import toast from 'react-hot-toast';

const Upload = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web',
    tags: '',
    visibility: 'public'
  });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'web', label: 'Web App', icon: Globe },
    { value: 'game', label: 'Game', icon: '🎮' },
    { value: 'tool', label: 'Tool', icon: '🔧' },
    { value: 'other', label: 'Other', icon: FileText }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (files.length === 0) {
      newErrors.files = 'At least one file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFilesToStorage = async (projectId) => {
    const uploadedFiles = [];
    let mainIndexFile = null;

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      const file = fileItem.file;
      
      setUploadProgress(((i + 1) / files.length) * 100);

      try {
        // Create file path
        const filePath = `projects/${projectId}/${file.name}`;
        const fileRef = ref(storage, filePath);

        // Upload file
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);

        const uploadedFile = {
          name: file.name,
          url: downloadURL,
          size: file.size,
          type: file.type
        };

        uploadedFiles.push(uploadedFile);

        // Check if this is the main HTML file
        if (file.name.toLowerCase() === 'index.html' || 
            (file.type === 'text/html' && !mainIndexFile)) {
          mainIndexFile = uploadedFile;
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}`);
      }
    }

    return { uploadedFiles, mainIndexFile };
  };

  const generatePreview = () => {
    if (files.length === 0) return;

    const htmlFile = files.find(f => f.file.name.toLowerCase().includes('.html'));
    const cssFiles = files.filter(f => f.file.name.toLowerCase().includes('.css'));
    const jsFiles = files.filter(f => f.file.name.toLowerCase().includes('.js'));

    if (!htmlFile) {
      toast.error('HTML file required for preview');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      let htmlContent = e.target.result;
      
      // Basic preview content
      setPreviewContent({
        html: htmlContent,
        css: cssFiles.length > 0 ? '/* CSS files detected */' : '',
        js: jsFiles.length > 0 ? '/* JavaScript files detected */' : ''
      });
      setShowPreview(true);
    };
    reader.readAsText(htmlFile.file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate project ID
      const projectId = generateId();
      
      // Upload files to storage
      const { uploadedFiles, mainIndexFile } = await uploadFilesToStorage(projectId);

      // Prepare tags array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      // Create project document
      const projectData = {
        projectId,
        ownerId: currentUser.uid,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: tagsArray,
        visibility: formData.visibility,
        files: uploadedFiles,
        indexURL: mainIndexFile?.url || uploadedFiles[0]?.url,
        slug: generateSlug(formData.title),
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        isPublished: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'projects'), projectData);
      
      toast.success('Project uploaded successfully!');
      navigate(`/project/${docRef.id}`);

    } catch (error) {
      console.error('Error uploading project:', error);
      toast.error(error.message || 'Failed to upload project');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Upload New Project
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Share your web project or game with the world
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Project Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Project Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter your project title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="input-field"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="public">
                  🌍 Public - Everyone can see
                </option>
                <option value="private">
                  🔒 Private - Only you can see
                </option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className={`input-field resize-none ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describe your project, what it does, and what makes it special..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.description}</span>
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="input-field"
                placeholder="react, javascript, css, game, tool (separate with commas)"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add tags to help others discover your project
              </p>
            </div>
          </div>
        </motion.div>

        {/* File Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <UploadIcon className="w-5 h-5" />
              <span>Project Files</span>
            </h2>
            
            {files.length > 0 && (
              <button
                type="button"
                onClick={generatePreview}
                className="btn-secondary flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}
          </div>

          <UploaderDropzone
            onFilesChange={setFiles}
            maxFiles={20}
          />
          
          {errors.files && (
            <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.files}</span>
            </p>
          )}
        </motion.div>

        {/* Preview Modal */}
        {showPreview && previewContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Project Preview
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="h-96">
                <ProjectPreviewIframe content={previewContent} />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end space-x-4"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
            disabled={uploading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="spinner"></div>
                <span>Uploading... {Math.round(uploadProgress)}%</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Upload Project</span>
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default Upload;
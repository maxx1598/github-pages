import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Globe, 
  Download,
  Share2,
  Flag,
  Edit,
  Trash2,
  Eye,
  ExternalLink
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  increment 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatRelativeTime, getCategoryColor } from '../utils/helpers';
import ProjectPreviewIframe from '../components/ProjectPreviewIframe';
import LikeButton from '../components/LikeButton';
import SubscribeButton from '../components/SubscribeButton';
import CommentList from '../components/CommentList';
import toast from 'react-hot-toast';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  
  const [project, setProject] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (project && !project.viewsCount) {
      // Increment view count (only once per session)
      incrementViewCount();
    }
  }, [project]);

  const fetchProject = async () => {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', id));
      
      if (!projectDoc.exists()) {
        navigate('/404');
        return;
      }

      const projectData = { id: projectDoc.id, ...projectDoc.data() };
      setProject(projectData);

      // Fetch owner details
      if (projectData.ownerId) {
        const ownerDoc = await getDoc(doc(db, 'users', projectData.ownerId));
        if (ownerDoc.exists()) {
          setOwner(ownerDoc.data());
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await updateDoc(doc(db, 'projects', id), {
        viewsCount: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'projects', id));
      toast.success('Project deleted successfully');
      navigate('/profile');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: project.title,
        text: project.description,
        url: window.location.href
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const canEdit = currentUser && (currentUser.uid === project?.ownerId || isAdmin);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-300 dark:bg-gray-600 h-8 rounded w-1/4 mb-4"></div>
          <div className="bg-gray-300 dark:bg-gray-600 h-96 rounded-lg mb-6"></div>
          <div className="space-y-3">
            <div className="bg-gray-300 dark:bg-gray-600 h-6 rounded w-3/4"></div>
            <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-full"></div>
            <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Project Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/explore" className="btn-primary">
            Browse Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card overflow-hidden"
          >
            <div className="h-96">
              <ProjectPreviewIframe
                projectUrl={project.indexURL}
                title={project.title}
              />
            </div>
          </motion.div>

          {/* Project Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {project.title}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getCategoryColor(project.category)}`}>
                    {project.category}
                  </span>
                </div>
                
                {/* Owner Info */}
                {owner && (
                  <div className="flex items-center space-x-2 mb-4">
                    <img
                      src={owner.avatarURL}
                      alt={owner.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <Link
                        to={`/user/${owner.username}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        {owner.displayName}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(project.createdAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                  title="Share project"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                {project.indexURL && (
                  <a
                    href={project.indexURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}

                {canEdit && (
                  <>
                    <Link
                      to={`/project/${id}/edit`}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                      title="Edit project"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
                      title="Delete project"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={`/explore?search=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Stats and Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <LikeButton
                  projectId={project.id}
                  initialLikes={project.likesCount || 0}
                  size="lg"
                />
                
                <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                  <Eye className="w-5 h-5" />
                  <span className="font-medium">{project.viewsCount || 0}</span>
                </div>

                <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formatDate(project.createdAt)}</span>
                </div>
              </div>

              {/* Subscribe Button */}
              {owner && currentUser && currentUser.uid !== owner.uid && (
                <SubscribeButton
                  targetUserId={owner.uid}
                  targetUsername={owner.username}
                />
              )}
            </div>
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CommentList projectId={project.id} />
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Files */}
          {project.files && project.files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Project Files
              </h3>
              <div className="space-y-2">
                {project.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Owner Profile Card */}
          {owner && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                About the Creator
              </h3>
              <div className="text-center">
                <img
                  src={owner.avatarURL}
                  alt={owner.displayName}
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {owner.displayName}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  @{owner.username}
                </p>
                {owner.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {owner.bio}
                  </p>
                )}
                <Link
                  to={`/user/${owner.username}`}
                  className="btn-primary w-full"
                >
                  View Profile
                </Link>
              </div>
            </motion.div>
          )}

          {/* Report Button */}
          {currentUser && currentUser.uid !== project.ownerId && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-4"
            >
              <button className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm transition-colors">
                <Flag className="w-4 h-4" />
                <span>Report Project</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
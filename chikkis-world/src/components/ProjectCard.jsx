import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Calendar,
  User,
  ExternalLink,
  Play
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { formatRelativeTime, getCategoryColor, truncateText } from '../utils/helpers';
import LikeButton from './LikeButton';

const ProjectCard = ({ project, showOwner = true }) => {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (showOwner && project.ownerId) {
      fetchOwner();
    } else {
      setLoading(false);
    }
  }, [project.ownerId, showOwner]);

  const fetchOwner = async () => {
    try {
      const ownerDoc = await getDoc(doc(db, 'users', project.ownerId));
      if (ownerDoc.exists()) {
        setOwner(ownerDoc.data());
      }
    } catch (error) {
      console.error('Error fetching project owner:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectThumbnail = () => {
    // If project has a thumbnail, use it
    if (project.thumbnailURL) {
      return project.thumbnailURL;
    }
    
    // Generate a gradient thumbnail based on project title
    const colors = [
      'from-blue-400 to-purple-600',
      'from-green-400 to-blue-600',
      'from-purple-400 to-pink-600',
      'from-yellow-400 to-red-600',
      'from-indigo-400 to-purple-600',
      'from-pink-400 to-red-600'
    ];
    
    const colorIndex = project.title.length % colors.length;
    return colors[colorIndex];
  };

  const thumbnail = getProjectThumbnail();
  const isGradient = !project.thumbnailURL;

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="bg-gray-300 dark:bg-gray-600 h-48 rounded-lg mb-4"></div>
        <div className="space-y-3">
          <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-3/4"></div>
          <div className="bg-gray-300 dark:bg-gray-600 h-3 rounded w-full"></div>
          <div className="bg-gray-300 dark:bg-gray-600 h-3 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="card overflow-hidden group"
    >
      {/* Project Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        {isGradient ? (
          <div className={`w-full h-full bg-gradient-to-br ${thumbnail} flex items-center justify-center`}>
            <div className="text-center text-white">
              <Play className="w-12 h-12 mx-auto mb-2 opacity-80" />
              <p className="text-lg font-semibold opacity-90">
                {project.title}
              </p>
            </div>
          </div>
        ) : (
          <img
            src={thumbnail}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(project.category)}`}>
            {project.category || 'web'}
          </span>
        </div>
        
        {/* Quick Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link
            to={`/project/${project.id}`}
            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
        
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </div>

      {/* Project Info */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <Link to={`/project/${project.id}`} className="hover:underline">
            {truncateText(project.title, 50)}
          </Link>
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {truncateText(project.description, 100)}
        </p>

        {/* Owner Info */}
        {showOwner && owner && (
          <div className="flex items-center space-x-2 mb-4">
            <img
              src={owner.avatarURL}
              alt={owner.displayName}
              className="w-6 h-6 rounded-full object-cover"
            />
            <Link
              to={`/user/${owner.username}`}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {owner.displayName}
            </Link>
          </div>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            {/* Like Button */}
            <LikeButton
              projectId={project.id}
              initialLikes={project.likesCount || 0}
              size="sm"
            />
            
            {/* Comments Count */}
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{project.commentsCount || 0}</span>
            </div>
            
            {/* Views Count (if available) */}
            {project.viewsCount && (
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{project.viewsCount}</span>
              </div>
            )}
          </div>

          {/* Upload Date */}
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{formatRelativeTime(project.createdAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
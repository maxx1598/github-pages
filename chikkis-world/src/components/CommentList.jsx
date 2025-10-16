import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Trash2, 
  Flag,
  MoreVertical
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const CommentList = ({ projectId }) => {
  const { currentUser, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    const commentsQuery = query(
      collection(db, 'comments'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
      const commentsData = [];
      
      for (const commentDoc of snapshot.docs) {
        const commentData = { id: commentDoc.id, ...commentDoc.data() };
        
        // Fetch author details
        try {
          const authorDoc = await getDoc(doc(db, 'users', commentData.authorId));
          if (authorDoc.exists()) {
            commentData.author = authorDoc.data();
          }
        } catch (error) {
          console.error('Error fetching comment author:', error);
        }
        
        commentsData.push(commentData);
      }
      
      setComments(commentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching comments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      // Add comment to Firestore
      await addDoc(collection(db, 'comments'), {
        projectId,
        authorId: currentUser.uid,
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });

      // Update project comments count
      await updateDoc(doc(db, 'projects', projectId), {
        commentsCount: increment(1)
      });

      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'comments', commentId));
      
      // Update project comments count
      await updateDoc(doc(db, 'projects', projectId), {
        commentsCount: increment(-1)
      });

      toast.success('Comment deleted');
      setShowDropdown(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const canDeleteComment = (comment) => {
    return currentUser && (
      currentUser.uid === comment.authorId || 
      isAdmin
    );
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-300 dark:bg-gray-600 h-6 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="bg-gray-300 dark:bg-gray-600 w-10 h-10 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-1/4"></div>
                <div className="bg-gray-300 dark:bg-gray-600 h-3 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex space-x-3">
            <img
              src={currentUser.photoURL || '/default-avatar.png'}
              alt="Your avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="input-field resize-none"
                disabled={submitting}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="spinner"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Sign in to join the conversation
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <AnimatePresence>
          {comments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to share your thoughts!
              </p>
            </motion.div>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="flex space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <img
                  src={comment.author?.avatarURL || '/default-avatar.png'}
                  alt={comment.author?.displayName || 'User'}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {comment.author?.displayName || 'Unknown User'}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    
                    {/* Comment Actions */}
                    {(canDeleteComment(comment) || currentUser) && (
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === comment.id ? null : comment.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        <AnimatePresence>
                          {showDropdown === comment.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10"
                            >
                              {canDeleteComment(comment) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              )}
                              
                              {currentUser && currentUser.uid !== comment.authorId && (
                                <button
                                  onClick={() => {
                                    toast.info('Report functionality coming soon');
                                    setShowDropdown(null);
                                  }}
                                  className="flex items-center space-x-2 w-full px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                  <Flag className="w-4 h-4" />
                                  <span>Report</span>
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommentList;
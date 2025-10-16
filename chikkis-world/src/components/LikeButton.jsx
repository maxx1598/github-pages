import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { 
  doc, 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const LikeButton = ({ projectId, initialLikes = 0, size = 'md' }) => {
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      checkIfLiked();
    }
  }, [currentUser, projectId]);

  const checkIfLiked = async () => {
    if (!currentUser) return;

    try {
      const likesQuery = query(
        collection(db, 'likes'),
        where('projectId', '==', projectId),
        where('userId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(likesQuery);
      setIsLiked(!snapshot.empty);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please sign in to like projects');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (isLiked) {
        // Unlike the project
        const likesQuery = query(
          collection(db, 'likes'),
          where('projectId', '==', projectId),
          where('userId', '==', currentUser.uid)
        );
        
        const snapshot = await getDocs(likesQuery);
        if (!snapshot.empty) {
          await deleteDoc(snapshot.docs[0].ref);
          
          // Update project likes count
          await updateDoc(doc(db, 'projects', projectId), {
            likesCount: increment(-1)
          });
          
          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
          toast.success('Removed from favorites');
        }
      } else {
        // Like the project
        await addDoc(collection(db, 'likes'), {
          projectId,
          userId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        // Update project likes count
        await updateDoc(doc(db, 'projects', projectId), {
          likesCount: increment(1)
        });
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center space-x-1 ${buttonSizeClasses[size]} rounded-full transition-all duration-200 ${
        isLiked
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 dark:hover:bg-red-900/20'}`}
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={`${sizeClasses[size]} transition-all duration-200 ${
            isLiked ? 'fill-current' : ''
          }`} 
        />
      </motion.div>
      <span className={`font-medium ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}>
        {likesCount}
      </span>
    </motion.button>
  );
};

export default LikeButton;
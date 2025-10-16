import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck } from 'lucide-react';
import { 
  doc, 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const SubscribeButton = ({ targetUserId, targetUsername, size = 'md' }) => {
  const { currentUser } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser && targetUserId) {
      checkSubscriptionStatus();
    }
  }, [currentUser, targetUserId]);

  const checkSubscriptionStatus = async () => {
    if (!currentUser) return;

    try {
      const subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        where('subscriberId', '==', currentUser.uid),
        where('targetUserId', '==', targetUserId)
      );
      
      const snapshot = await getDocs(subscriptionsQuery);
      setIsSubscribed(!snapshot.empty);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser) {
      toast.error('Please sign in to follow users');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        const subscriptionsQuery = query(
          collection(db, 'subscriptions'),
          where('subscriberId', '==', currentUser.uid),
          where('targetUserId', '==', targetUserId)
        );
        
        const snapshot = await getDocs(subscriptionsQuery);
        if (!snapshot.empty) {
          await deleteDoc(snapshot.docs[0].ref);
          setIsSubscribed(false);
          toast.success(`Unfollowed ${targetUsername}`);
        }
      } else {
        // Subscribe
        await addDoc(collection(db, 'subscriptions'), {
          subscriberId: currentUser.uid,
          targetUserId,
          createdAt: serverTimestamp()
        });
        
        setIsSubscribed(true);
        toast.success(`Now following ${targetUsername}`);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if user is trying to follow themselves
  if (currentUser && currentUser.uid === targetUserId) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSubscribe}
      disabled={loading}
      className={`
        flex items-center space-x-2 font-medium rounded-lg transition-all duration-200
        ${sizeClasses[size]}
        ${isSubscribed
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <motion.div
        animate={isSubscribed ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isSubscribed ? (
          <UserCheck className={iconSizeClasses[size]} />
        ) : (
          <UserPlus className={iconSizeClasses[size]} />
        )}
      </motion.div>
      <span>
        {loading 
          ? '...' 
          : isSubscribed 
            ? 'Following' 
            : 'Follow'
        }
      </span>
    </motion.button>
  );
};

export default SubscribeButton;
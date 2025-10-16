import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Edit, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Mail,
  Users,
  Heart,
  Eye,
  Grid,
  List,
  Settings,
  Upload,
  Save,
  X,
  Camera
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, storage } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, generateAvatarUrl } from '../utils/helpers';
import ProjectCard from '../components/ProjectCard';
import SubscribeButton from '../components/SubscribeButton';
import toast from 'react-hot-toast';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    projectsCount: 0,
    likesCount: 0,
    followersCount: 0,
    followingCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('projects');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: ''
  });
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  const isOwnProfile = !username || (userProfile && userProfile.username === username);

  useEffect(() => {
    if (isOwnProfile && userProfile) {
      setProfile(userProfile);
      setEditForm({
        displayName: userProfile.displayName || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        website: userProfile.website || ''
      });
      fetchUserProjects(userProfile.uid);
      fetchUserStats(userProfile.uid);
    } else if (username) {
      fetchUserByUsername(username);
    }
  }, [username, userProfile, isOwnProfile]);

  const fetchUserByUsername = async (username) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username.toLowerCase())
      );
      
      const snapshot = await getDocs(usersQuery);
      
      if (snapshot.empty) {
        navigate('/404');
        return;
      }

      const userData = snapshot.docs[0].data();
      setProfile(userData);
      fetchUserProjects(userData.uid);
      fetchUserStats(userData.uid);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProjects = async (userId) => {
    try {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('ownerId', '==', userId),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(projectsQuery);
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching user projects:', error);
    }
  };

  const fetchUserStats = async (userId) => {
    try {
      // Get projects count
      const projectsQuery = query(
        collection(db, 'projects'),
        where('ownerId', '==', userId),
        where('isPublished', '==', true)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      
      // Get total likes on user's projects
      let totalLikes = 0;
      projectsSnapshot.docs.forEach(doc => {
        totalLikes += doc.data().likesCount || 0;
      });

      // Get followers count
      const followersQuery = query(
        collection(db, 'subscriptions'),
        where('targetUserId', '==', userId)
      );
      const followersSnapshot = await getDocs(followersQuery);

      // Get following count
      const followingQuery = query(
        collection(db, 'subscriptions'),
        where('subscriberId', '==', userId)
      );
      const followingSnapshot = await getDocs(followingQuery);

      setStats({
        projectsCount: projectsSnapshot.size,
        likesCount: totalLikes,
        followersCount: followersSnapshot.size,
        followingCount: followingSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Avatar file size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !currentUser) return null;

    try {
      const avatarRef = ref(storage, `avatars/${currentUser.uid}/${Date.now()}`);
      await uploadBytes(avatarRef, avatarFile);
      const downloadURL = await getDownloadURL(avatarRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw new Error('Failed to upload avatar');
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      let avatarURL = profile.avatarURL;

      // Upload new avatar if selected
      if (avatarFile) {
        avatarURL = await uploadAvatar();
      }

      const updates = {
        displayName: editForm.displayName.trim(),
        bio: editForm.bio.trim(),
        location: editForm.location.trim(),
        website: editForm.website.trim(),
        ...(avatarURL !== profile.avatarURL && { avatarURL })
      };

      // Update Firestore
      await updateUserProfile(updates);

      // Update auth profile
      await updateProfile(currentUser, {
        displayName: updates.displayName,
        photoURL: avatarURL
      });

      setProfile(prev => ({ ...prev, ...updates }));
      setIsEditing(false);
      setAvatarFile(null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'projects', label: 'Projects', count: stats.projectsCount },
    { id: 'liked', label: 'Liked', count: null },
    { id: 'following', label: 'Following', count: stats.followingCount },
    { id: 'followers', label: 'Followers', count: stats.followersCount }
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="bg-gray-300 dark:bg-gray-600 h-6 rounded w-1/4"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-1/2"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-1/3"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-300 dark:bg-gray-600 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            User Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The user you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="relative">
            <img
              src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatarURL}
              alt={profile.displayName}
              className="w-24 h-24 rounded-full object-cover"
            />
            {isOwnProfile && isEditing && (
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="input-field text-2xl font-bold"
                  placeholder="Display Name"
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    className="input-field"
                    placeholder="Location"
                  />
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                    className="input-field"
                    placeholder="Website URL"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile.displayName}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-1">
                  @{profile.username}
                </p>
                {profile.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(profile.createdAt)}</span>
                  </div>
                  {profile.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {isOwnProfile ? (
              isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setAvatarFile(null);
                    }}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="spinner"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/upload')}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </>
              )
            ) : (
              <SubscribeButton
                targetUserId={profile.uid}
                targetUsername={profile.username}
                size="md"
              />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.projectsCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.likesCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.followersCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.followingCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="font-medium">{tab.label}</span>
                {tab.count !== null && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'projects' && (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'projects' && (
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <Upload className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {isOwnProfile 
                    ? "Start sharing your work with the world!"
                    : `${profile.displayName} hasn't uploaded any projects yet.`
                  }
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/upload')}
                    className="btn-primary"
                  >
                    Upload Your First Project
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}>
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProjectCard project={project} showOwner={false} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'liked' && (
          <motion.div
            key="liked"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-16"
          >
            <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Liked Projects
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Coming soon! This feature will show liked projects.
            </p>
          </motion.div>
        )}

        {(activeTab === 'following' || activeTab === 'followers') && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-16"
          >
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {activeTab === 'following' ? 'Following' : 'Followers'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Coming soon! This feature will show {activeTab === 'following' ? 'users being followed' : 'followers'}.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
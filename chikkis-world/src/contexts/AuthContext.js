import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { generateAvatarUrl, isAdmin } from '../utils/helpers';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  const signup = async (email, password, username, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update auth profile
    await updateProfile(user, {
      displayName: displayName || username,
      photoURL: generateAvatarUrl(username)
    });

    // Create user document in Firestore
    const userDoc = {
      uid: user.uid,
      username: username.toLowerCase(),
      displayName: displayName || username,
      email: email,
      bio: '',
      avatarURL: generateAvatarUrl(username),
      isAdmin: email === process.env.REACT_APP_ADMIN_EMAIL,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);
    return user;
  };

  // Sign in with email and password
  const signin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last active time
    if (userCredential.user) {
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastActiveAt: serverTimestamp()
      });
    }
    
    return userCredential.user;
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document
      const username = user.email.split('@')[0].toLowerCase();
      const newUserDoc = {
        uid: user.uid,
        username: username,
        displayName: user.displayName || username,
        email: user.email,
        bio: '',
        avatarURL: user.photoURL || generateAvatarUrl(username),
        isAdmin: user.email === process.env.REACT_APP_ADMIN_EMAIL,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', user.uid), newUserDoc);
    } else {
      // Update last active time
      await updateDoc(doc(db, 'users', user.uid), {
        lastActiveAt: serverTimestamp()
      });
    }

    return user;
  };

  // Sign out
  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) return;

    // Update Firestore document
    await updateDoc(doc(db, 'users', currentUser.uid), {
      ...updates,
      lastActiveAt: serverTimestamp()
    });

    // Update auth profile if display name or photo changed
    if (updates.displayName || updates.avatarURL) {
      await updateProfile(currentUser, {
        displayName: updates.displayName || currentUser.displayName,
        photoURL: updates.avatarURL || currentUser.photoURL
      });
    }

    // Refresh user profile
    const updatedDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (updatedDoc.exists()) {
      setUserProfile(updatedDoc.data());
    }
  };

  // Get user profile by ID
  const getUserProfile = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    signin,
    signInWithGoogle,
    logout,
    updateUserProfile,
    getUserProfile,
    isAdmin: userProfile ? isAdmin(userProfile) : false
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
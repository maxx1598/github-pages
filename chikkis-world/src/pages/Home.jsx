import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Compass, 
  Users, 
  Code, 
  Gamepad2, 
  Star,
  ArrowRight,
  Play,
  Heart,
  MessageCircle
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import ProjectCard from '../components/ProjectCard';

const Home = () => {
  const { currentUser } = useAuth();
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalLikes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProjects();
    fetchStats();
  }, []);

  const fetchFeaturedProjects = async () => {
    try {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('isPublished', '==', true),
        where('visibility', '==', 'public'),
        orderBy('likesCount', 'desc'),
        limit(6)
      );
      
      const snapshot = await getDocs(projectsQuery);
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFeaturedProjects(projects);
    } catch (error) {
      console.error('Error fetching featured projects:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total projects
      const projectsSnapshot = await getDocs(
        query(collection(db, 'projects'), where('isPublished', '==', true))
      );
      
      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // Get total likes
      const likesSnapshot = await getDocs(collection(db, 'likes'));

      setStats({
        totalProjects: projectsSnapshot.size,
        totalUsers: usersSnapshot.size,
        totalLikes: likesSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Upload,
      title: 'Upload & Deploy',
      description: 'Upload your web projects and games instantly. Get a live preview URL to share with the world.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Compass,
      title: 'Explore & Discover',
      description: 'Browse amazing projects from creators worldwide. Filter by category, tags, and popularity.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Connect & Follow',
      description: 'Follow your favorite creators, get notified of new projects, and build your community.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Star,
      title: 'Like & Comment',
      description: 'Show appreciation for great work. Leave feedback and engage with the community.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Welcome to{' '}
              <span className="gradient-text">Chikki's World</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Upload, deploy, and showcase your web projects and games. 
              Connect with creators and discover amazing work from around the world.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {currentUser ? (
                <Link to="/upload" className="btn-primary text-lg px-8 py-4 flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Project</span>
                </Link>
              ) : (
                <Link to="/auth" className="btn-primary text-lg px-8 py-4 flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Get Started</span>
                </Link>
              )}
              
              <Link to="/explore" className="btn-secondary text-lg px-8 py-4 flex items-center space-x-2">
                <Compass className="w-5 h-5" />
                <span>Explore Projects</span>
              </Link>
            </motion.div>

            {/* Stats */}
            {!loading && (
              <motion.div 
                className="grid grid-cols-3 gap-8 mt-16 max-w-md mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalProjects}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.totalUsers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Creators</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                    {stats.totalLikes}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Share Your Work
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From upload to deployment, we've got you covered with powerful tools and a vibrant community.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="card p-6 text-center group hover:shadow-2xl transition-all duration-300"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Featured Projects
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Discover the most popular and innovative projects from our community.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
            >
              {featuredProjects.map((project, index) => (
                <motion.div key={project.id} variants={itemVariants}>
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center">
              <Link
                to="/explore"
                className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-lg group"
              >
                <span>View All Projects</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Share Your Creativity?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already showcasing their work on Chikki's World.
            </p>
            
            {!currentUser ? (
              <Link
                to="/auth"
                className="inline-flex items-center space-x-2 bg-white text-blue-600 hover:bg-gray-100 font-medium px-8 py-4 rounded-lg text-lg transition-all duration-200 hover:scale-105"
              >
                <span>Join Now - It's Free!</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/upload"
                className="inline-flex items-center space-x-2 bg-white text-blue-600 hover:bg-gray-100 font-medium px-8 py-4 rounded-lg text-lg transition-all duration-200 hover:scale-105"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Your First Project</span>
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List,
  SortAsc,
  SortDesc,
  Calendar,
  Heart,
  Eye
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  startAfter
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { debounce } from '../utils/helpers';
import ProjectCard from '../components/ProjectCard';

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState('grid');

  const categories = [
    { value: 'all', label: 'All Projects' },
    { value: 'web', label: 'Web Apps' },
    { value: 'game', label: 'Games' },
    { value: 'tool', label: 'Tools' },
    { value: 'other', label: 'Other' }
  ];

  const sortOptions = [
    { value: 'latest', label: 'Latest', icon: Calendar },
    { value: 'popular', label: 'Most Popular', icon: Heart },
    { value: 'views', label: 'Most Viewed', icon: Eye }
  ];

  useEffect(() => {
    fetchProjects(true);
  }, [selectedCategory, sortBy, searchQuery]);

  const fetchProjects = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setProjects([]);
      setLastDoc(null);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let projectsQuery = collection(db, 'projects');
      const constraints = [
        where('isPublished', '==', true),
        where('visibility', '==', 'public')
      ];

      // Add category filter
      if (selectedCategory !== 'all') {
        constraints.push(where('category', '==', selectedCategory));
      }

      // Add search filter (basic implementation)
      if (searchQuery.trim()) {
        // Note: Firestore doesn't support full-text search natively
        // In a real app, you'd use Algolia or similar service
        // For now, we'll search in title (case-insensitive approach is limited)
        constraints.push(where('title', '>=', searchQuery));
        constraints.push(where('title', '<=', searchQuery + '\uf8ff'));
      }

      // Add sorting
      switch (sortBy) {
        case 'popular':
          constraints.push(orderBy('likesCount', 'desc'));
          break;
        case 'views':
          constraints.push(orderBy('viewsCount', 'desc'));
          break;
        case 'latest':
        default:
          constraints.push(orderBy('createdAt', 'desc'));
          break;
      }

      // Add pagination
      constraints.push(limit(12));
      if (!reset && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      projectsQuery = query(projectsQuery, ...constraints);
      const snapshot = await getDocs(projectsQuery);

      const newProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (reset) {
        setProjects(newProjects);
      } else {
        setProjects(prev => [...prev, ...newProjects]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 12);

    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearchChange = debounce((value) => {
    setSearchQuery(value);
    if (value.trim()) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  }, 300);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProjects(false);
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Explore Projects
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 dark:text-gray-300 text-lg"
        >
          Discover amazing projects from creators around the world
        </motion.p>
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6 mb-8"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                defaultValue={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full lg:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field w-full lg:w-auto"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="w-full lg:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field w-full lg:w-auto"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Projects Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="card p-6 animate-pulse">
              <div className="bg-gray-300 dark:bg-gray-600 h-48 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-3/4"></div>
                <div className="bg-gray-300 dark:bg-gray-600 h-3 rounded w-full"></div>
                <div className="bg-gray-300 dark:bg-gray-600 h-3 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Try adjusting your search criteria or browse all projects.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSearchParams({});
            }}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </motion.div>
      ) : (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}
          >
            {projects.map((project, index) => (
              <motion.div key={project.id} variants={itemVariants}>
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </motion.div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-12">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <div className="flex items-center space-x-2">
                    <div className="spinner"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load More Projects'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
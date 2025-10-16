# 🌟 Chikki's World - Creative Project Platform

A modern, full-featured React platform where users can upload, deploy, and showcase their web projects and games. Built with React, Firebase, and Tailwind CSS.

![Chikki's World](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Chikki%27s+World)

## ✨ Features

### 🔐 User Authentication
- **Email/Password Authentication** - Secure signup and login
- **Google Sign-in** - Quick authentication with Google
- **Profile Management** - Customizable user profiles with avatars
- **Admin System** - Comprehensive admin dashboard

### 📁 Project Management
- **File Upload & Deploy** - Upload HTML, CSS, JS, images, and ZIP files
- **Live Preview** - Sandboxed iframe preview for security
- **Project Categories** - Web apps, games, tools, and more
- **Tags & Search** - Organize and discover projects easily
- **Public/Private Visibility** - Control who can see your projects

### 🌍 Social Features
- **Like System** - Show appreciation for great work
- **Comments** - Engage with creators and provide feedback
- **Follow System** - Subscribe to your favorite creators
- **User Profiles** - Showcase your work and bio

### 🛡️ Admin Dashboard
- **User Management** - View, manage, and moderate users
- **Project Moderation** - Publish/unpublish and delete projects
- **Comment Moderation** - Remove inappropriate comments
- **Analytics** - Platform statistics and activity charts
- **Security Controls** - Comprehensive admin tools

### 🎨 Modern UI/UX
- **Responsive Design** - Works perfectly on all devices
- **Dark/Light Mode** - Automatic theme detection
- **Smooth Animations** - Framer Motion powered interactions
- **Beautiful Components** - Modern design with Tailwind CSS
- **Accessibility** - WCAG compliant interface

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase project with Authentication, Firestore, and Storage enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chikkis-world
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_ADMIN_EMAIL=admin@chikki.world
   REACT_APP_ADMIN_PASSWORD=AdminPass123!
   ```

4. **Set up Firebase Security Rules**
   
   Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   
   Deploy Storage rules:
   ```bash
   firebase deploy --only storage
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Create admin user**
   - Sign up with the admin email (`admin@chikki.world`)
   - The system will automatically grant admin privileges

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── AdminPanel/      # Admin-specific components
│   ├── Navbar.jsx       # Navigation bar
│   ├── ProjectCard.jsx  # Project display card
│   ├── LikeButton.jsx   # Like functionality
│   ├── CommentList.jsx  # Comments system
│   └── ...
├── pages/               # Main application pages
│   ├── Home.jsx         # Landing page
│   ├── Explore.jsx      # Project discovery
│   ├── Upload.jsx       # Project upload
│   ├── Profile.jsx      # User profiles
│   ├── ProjectDetail.jsx # Project view
│   ├── AdminDashboard.jsx # Admin panel
│   └── Auth.jsx         # Authentication
├── contexts/            # React contexts
│   └── AuthContext.js   # Authentication state
├── utils/               # Utility functions
│   ├── firebase.js      # Firebase configuration
│   ├── helpers.js       # Helper functions
│   └── sanitizer.js     # Security utilities
├── styles/              # CSS and styling
│   └── global.css       # Global styles
└── hooks/               # Custom React hooks
```

## 🔥 Firebase Configuration

### Firestore Collections

```javascript
// Users collection
users/{userId} {
  uid: string,
  username: string,
  displayName: string,
  email: string,
  bio: string,
  avatarURL: string,
  isAdmin: boolean,
  createdAt: timestamp,
  lastActiveAt: timestamp
}

// Projects collection
projects/{projectId} {
  projectId: string,
  ownerId: string,
  title: string,
  description: string,
  tags: array,
  category: string,
  indexURL: string,
  files: array,
  likesCount: number,
  commentsCount: number,
  isPublished: boolean,
  visibility: string,
  createdAt: timestamp
}

// Comments collection
comments/{commentId} {
  projectId: string,
  authorId: string,
  text: string,
  createdAt: timestamp
}

// Likes collection
likes/{likeId} {
  projectId: string,
  userId: string,
  createdAt: timestamp
}

// Subscriptions collection
subscriptions/{subscriptionId} {
  subscriberId: string,
  targetUserId: string,
  createdAt: timestamp
}
```

### Security Rules

The platform includes comprehensive security rules:

- **Authentication Required** - Most operations require user authentication
- **Owner Permissions** - Users can only modify their own content
- **Admin Override** - Admins can moderate all content
- **File Type Validation** - Only safe file types are allowed
- **Size Limits** - Files are limited to prevent abuse
- **Input Validation** - All data is validated before storage

## 🛡️ Security Features

### Content Security
- **Sandboxed Previews** - User content runs in secure iframes
- **File Type Validation** - Only safe file types accepted
- **Content Sanitization** - HTML/CSS/JS content is sanitized
- **Size Limits** - Prevents large file uploads

### User Security
- **Firebase Authentication** - Secure user management
- **Input Validation** - All user inputs are validated
- **XSS Protection** - Content is sanitized against XSS attacks
- **CSRF Protection** - Firebase handles CSRF protection

### Admin Security
- **Role-based Access** - Admin features restricted to admin users
- **Audit Trails** - All admin actions are logged
- **Secure Rules** - Firestore rules prevent unauthorized access

## 🎨 Customization

### Themes
The platform supports custom themes through Tailwind CSS:

```css
/* Custom color palette */
:root {
  --primary-50: #f0f9ff;
  --primary-500: #0ea5e9;
  --primary-900: #0c4a6e;
}
```

### Components
All components are modular and can be easily customized:

```jsx
// Example: Custom project card
<ProjectCard 
  project={project}
  showOwner={true}
  size="large"
  variant="minimal"
/>
```

## 📱 Responsive Design

The platform is fully responsive with breakpoints:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

## 🚀 Deployment

### Firebase Hosting

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

### Other Platforms

The built files in `/build` can be deployed to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

## 🔧 Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Environment Variables

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=

# Admin Configuration
REACT_APP_ADMIN_EMAIL=admin@chikki.world
REACT_APP_ADMIN_PASSWORD=AdminPass123!
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React** - UI framework
- **Firebase** - Backend services
- **Tailwind CSS** - Styling framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Recharts** - Chart library

## 📞 Support

For support, email support@chikki.world or create an issue on GitHub.

---

**Built with ❤️ by the Chikki's World team**
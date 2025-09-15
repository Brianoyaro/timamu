# Telepsychology Platform - Frontend

A modern React frontend for the comprehensive telepsychology platform supporting patients, therapists, and administrators.

## 🚀 Features

- **Modern UI**: Clean, responsive design with Tailwind CSS and Headless UI
- **Role-based Access**: Different interfaces for patients, therapists, and admins
- **Real-time Communication**: Socket.IO integration for live chat and notifications
- **Video Conferencing**: WebRTC-based therapy sessions with screen sharing
- **State Management**: Zustand for lightweight, efficient state management
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: JWT-based auth with Google OAuth integration
- **Responsive Design**: Mobile-first design that works on all devices

## 🛠️ Tech Stack

- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Headless UI and Heroicons
- **State Management**: Zustand with persistence
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with React Query for caching
- **Real-time**: Socket.IO client
- **Routing**: React Router v6
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see Backend/README.md)

## 🔧 Installation

1. **Navigate to frontend directory**
   ```bash
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## ⚙️ Environment Configuration

### Required Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=TelePsy
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development

# WebSocket Configuration  
VITE_SOCKET_URL=http://localhost:5000

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Feature Flags
VITE_ENABLE_GOOGLE_AUTH=true
VITE_ENABLE_VIDEO_CALLS=true
VITE_ENABLE_CHAT=true

# Debug Mode
VITE_DEBUG=true
```

## 🏃‍♂️ Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Build for production
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
```

## 📁 Project Structure

```
Frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Auth/        # Authentication components
│   │   ├── Dashboard/   # Dashboard components
│   │   └── Layout/      # Layout components
│   ├── pages/           # Page components
│   │   ├── Auth/        # Login/Register pages
│   │   ├── Dashboard/   # Dashboard page
│   │   ├── Sessions/    # Session-related pages
│   │   ├── Profile/     # Profile management
│   │   ├── Therapists/  # Therapist listing
│   │   └── Admin/       # Admin panel
│   ├── stores/          # Zustand state stores
│   │   ├── authStore.js     # Authentication state
│   │   ├── socketStore.js   # Real-time communication
│   │   └── sessionStore.js  # Session management
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles with Tailwind
├── .env                 # Environment variables
├── .env.example         # Environment template
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── vite.config.js       # Vite configuration
```

## 👥 User Roles & Features

### Patients
- **Landing Page**: Marketing site with feature overview
- **Registration**: Account creation with role selection
- **Dashboard**: Session overview, upcoming appointments, quick actions
- **Therapist Discovery**: Browse and filter licensed therapists
- **Session Booking**: Schedule appointments with preferred therapists
- **Video Sessions**: Join secure video calls with therapists
- **Profile Management**: Update personal information and preferences

### Therapists
- **Professional Dashboard**: Patient management and schedule overview
- **Session Management**: View, reschedule, and manage appointments
- **Video Platform**: Conduct therapy sessions with integrated tools
- **Availability Settings**: Set working hours and availability
- **Patient Notes**: Session documentation and treatment plans
- **Profile Configuration**: Professional credentials and specialties

### Administrators
- **Admin Dashboard**: Platform overview and key metrics
- **User Management**: Manage patients, therapists, and staff
- **Analytics**: Platform usage statistics and reporting
- **System Monitoring**: Health checks and performance metrics
- **Content Management**: Platform resources and configurations
- **Audit Logs**: Security and compliance monitoring

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6) - Main brand color
- **Secondary**: Teal (#14b8a6) - Accent color
- **Gray Scale**: Comprehensive gray palette for UI elements
- **Status Colors**: Green (success), Red (error), Yellow (warning)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 300 (light), 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Responsive Sizing**: Tailwind typography scale

### Components
- **Forms**: Consistent input styling with validation states
- **Buttons**: Primary, secondary, and outline variants
- **Cards**: Clean containers for content sections
- **Navigation**: Responsive header with role-based menu items
- **Modals**: Overlay dialogs with smooth animations

## 🔌 API Integration

### Authentication
- Login/register with email and password
- Google OAuth integration
- JWT token management with automatic refresh
- Protected route handling

### Real-time Features
- Socket.IO connection management
- Live chat during sessions
- Real-time notifications
- Presence indicators

### Session Management
- CRUD operations for therapy sessions
- WebRTC signaling for video calls
- File sharing capabilities
- Session notes and documentation

## 🧪 Development Notes

### State Management
- **Zustand**: Lightweight state management with persistence
- **React Query**: Server state caching and synchronization
- **Local Storage**: Persistent authentication state

### Performance
- **Code Splitting**: Lazy loading for route components
- **Image Optimization**: Responsive images with proper formats
- **Bundle Analysis**: Vite build optimization

### Security
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based request validation
- **Content Security Policy**: Strict CSP headers
- **Secure Storage**: Encrypted sensitive data

## 📱 Mobile Support

- **Responsive Design**: Mobile-first approach
- **Touch Optimization**: Touch-friendly interactive elements
- **Progressive Web App**: PWA capabilities for mobile installation
- **Offline Support**: Basic offline functionality (planned)

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
1. Set production API URL
2. Configure Google OAuth credentials
3. Enable production optimizations
4. Set up CDN for static assets

### Deployment Platforms
- **Vercel**: Recommended for easy deployment
- **Netlify**: Alternative platform with great features
- **AWS S3 + CloudFront**: Full AWS integration
- **Docker**: Containerized deployment option

## 🤝 Contributing

1. Follow React and JavaScript best practices
2. Use TypeScript for new components (migration in progress)
3. Maintain consistent component structure
4. Add proper error handling and loading states
5. Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This is a production-grade healthcare application. Ensure compliance with relevant regulations (HIPAA, GDPR, etc.) in your deployment environment.

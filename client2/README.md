# MindLink - Professional Telepsychology Platform

A comprehensive, frontend-only telepsychology web application built with React, designed for connecting patients with licensed mental health professionals through secure video sessions, messaging, and digital tools.

## 🌟 Features

### Core Functionality
- **Multi-role Authentication**: Patient, Therapist, and Admin roles with role-based access control
- **Video Conferencing**: WebRTC-powered 1:1 video sessions with device management and waiting rooms
- **Secure Messaging**: Real-time chat between patients and therapists with file attachments
- **Scheduling System**: Comprehensive appointment booking and availability management
- **Mental Health Assessments**: PHQ-9, GAD-7 questionnaires with mood tracking
- **Crisis Resources**: Always-accessible crisis intervention resources and safety planning
- **Multi-tenancy**: Tenant-aware architecture with tenant switching for admins

### Technical Features
- **Accessibility**: WCAG 2.2 AA compliant with semantic HTML, ARIA support, and keyboard navigation
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Internationalization**: i18next integration with English default (Swahili ready)
- **Dark Mode**: Class-based theming with system preference detection
- **PWA Ready**: Service worker, manifest, and offline shell capabilities
- **Analytics Ready**: Abstracted analytics service for easy integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with WebRTC support

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and set your backend URL:
```env
VITE_BACKEND_URL=https://your-backend-api.com
```

3. **Start development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

## 🏗️ Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── video/          # Video conferencing components
│   ├── messaging/      # Chat and messaging components
│   ├── scheduling/     # Calendar and appointment components
│   ├── dashboard/      # Role-specific dashboard components
│   ├── admin/          # Admin console components
│   └── common/         # Shared UI components
├── layouts/            # Page layouts (Auth, Main)
├── pages/              # Route components
├── services/           # API services and utilities
├── store/              # Zustand state management
├── config/             # Configuration files and constants
├── i18n/               # Internationalization
└── utils/              # Utility functions
```

### State Management
- **Zustand** for global state management
- Separate stores for auth, tenant, session, theme, and toast management
- Persistent state for authentication tokens and theme preferences

### API Integration
- Centralized API service with automatic tenant header injection
- Error handling and retry logic
- File upload support with progress tracking
- Mock service implementations for easy backend integration

## 🔌 Backend Integration

### API Endpoints Expected

The frontend expects these REST endpoints from your backend:

#### Authentication
```
POST /auth/login          # Sign in
POST /auth/register       # Sign up  
POST /auth/logout         # Sign out
POST /auth/refresh        # Refresh token
POST /auth/forgot-password # Request password reset
POST /auth/reset-password  # Reset password
GET  /auth/me             # Get current user
```

#### Tenants
```
GET    /tenants           # List user's tenants
GET    /tenants/:id       # Get tenant details
POST   /tenants           # Create tenant (admin)
PATCH  /tenants/:id       # Update tenant
DELETE /tenants/:id       # Delete tenant
```

#### Users
```
GET    /users             # List users (with role filter)
GET    /users/:id         # Get user details
PATCH  /users/:id         # Update user
PATCH  /users/:id/roles   # Update user roles
POST   /users/me/avatar   # Upload avatar
POST   /users/me/data-export    # Request data export
POST   /users/me/data-delete    # Request account deletion
```

#### Sessions & Video
```
GET    /sessions          # List sessions
POST   /sessions          # Create session
GET    /sessions/:id      # Get session details
POST   /sessions/:id/join # Join session
POST   /sessions/:id/end  # End session
POST   /sessions/:id/signal     # WebRTC signaling
GET    /sessions/:id/signals    # Get WebRTC signals
POST   /sessions/:id/admit      # Admit patient (therapist)
```

#### Scheduling
```
GET    /appointments      # List appointments
POST   /appointments      # Create appointment
GET    /appointments/:id  # Get appointment
PATCH  /appointments/:id  # Update appointment
GET    /therapists/:id/availability  # Get availability
POST   /therapists/:id/availability # Set availability
```

#### Messaging
```
GET    /threads           # List message threads
GET    /threads/:id       # Get thread details
GET    /threads/:id/messages      # Get messages
POST   /threads/:id/messages      # Send message
POST   /threads/:id/attachments   # Upload attachment
```

#### Assessments
```
GET    /assessments       # List assessments
POST   /assessments       # Submit assessment
GET    /assessments/history       # Get assessment history
GET    /mood-checkins     # Get mood check-ins
POST   /mood-checkins     # Submit mood check-in
```

### Headers
All API requests include:
- `Authorization: Bearer <token>` (when authenticated)
- `x-tenant-id: <tenant-id>` (for tenant-aware requests)
- `Content-Type: application/json`

## 🎨 Theming & Customization

### Color System
- **Primary**: Blue (#3b82f6) - Main brand color
- **Therapeutic**: Green (#22c55e) - Calming, health-focused actions
- **Calm**: Gray scale for neutral elements
- **Status Colors**: Success, warning, error states

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Dark Mode
Class-based dark mode with system preference detection and localStorage persistence.

## 🔒 Security & Compliance

### Privacy by Design
- No sensitive data stored in localStorage
- Secure token handling with optional "remember me"
- HIPAA-compliant UI patterns and disclaimers
- Crisis intervention resources always accessible

### Accessibility
- WCAG 2.2 AA compliance
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader optimization

## 🌍 Internationalization

### Adding New Languages

1. **Create translation file:**
```bash
src/i18n/locales/sw.json  # For Swahili
```

2. **Add to i18n config:**
```javascript
// src/i18n/index.js
import sw from './locales/sw.json'

const resources = {
  en: { translation: en },
  sw: { translation: sw }  // Add new language
}
```

3. **Update language switcher:**
```javascript
// src/components/common/LanguageSwitcher.jsx
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' }  // Add new language
]
```

## 📱 PWA Configuration

The app is PWA-ready with:
- Service worker for offline shell caching
- Web app manifest with proper icons and metadata
- Install prompts and app-like experience
- Background sync capabilities (when backend supports it)

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Environment Variables
```env
# Backend Configuration
VITE_BACKEND_URL=https://api.mindlink.example.com

# App Configuration  
VITE_APP_NAME=MindLink
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
VITE_ENABLE_DARK_MODE=true

# WebRTC
VITE_WEBRTC_ICE_SERVERS=stun:stun.l.google.com:19302
```

### Adding New Features

1. **Create component in appropriate directory**
2. **Add route to AppRoutes.jsx if needed**
3. **Update navigation config if adding to menu**
4. **Add translations to locale files**
5. **Create corresponding service methods**
6. **Add analytics tracking where appropriate**

## 🧪 Testing Strategy

### Recommended Testing Approach
- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: API service interactions
- **E2E Tests**: Critical user flows (auth, booking, video sessions)
- **Accessibility Tests**: Screen reader and keyboard navigation
- **Performance Tests**: Bundle size and loading times

### Mock Data
All components use mock data that can be easily replaced with real API calls. Look for comments like:
```javascript
// Mock data - replace with real API call
const mockData = await apiService.getData()
```

## 🚀 Deployment

### Build Configuration
The app builds to static files that can be deployed to any static hosting service:

```bash
npm run build
# Outputs to dist/ directory
```

### Environment Setup
1. Set production environment variables
2. Configure your backend URL
3. Set up analytics tracking (optional)
4. Configure PWA settings for your domain

## 📞 Support & Contributing

### Crisis Resources
The app includes configurable crisis resources in `src/config/crisis.json`. Update this file with locale-specific emergency numbers and mental health hotlines.

### Compliance Notes
- All user data handling follows HIPAA guidelines
- Session recordings require explicit consent
- Emergency disclaimers are prominently displayed
- Data export and deletion capabilities included

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This is a frontend-only implementation. You'll need to implement the corresponding backend API endpoints to have a fully functional application. All API calls are abstracted through service layers for easy integration.

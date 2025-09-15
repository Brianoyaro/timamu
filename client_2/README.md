# Timamu Client Application

A modern, secure React application for the Timamu mental health platform. Built with security-first principles and mobile-responsive design.

## 🚀 Features

### Authentication & Security
- **JWT-based Authentication** with access/refresh token rotation
- **Google OAuth Integration** for seamless sign-in
- **Role-based Access Control** (Patient, Therapist, Admin)
- **Password Strength Validation** with real-time feedback
- **Secure Token Management** with automatic refresh
- **CSRF Protection** and secure API communication

### User Experience
- **Mobile-First Design** with responsive layout
- **Progressive Web App** capabilities
- **Real-time Notifications** with toast system
- **Smooth Animations** with Framer Motion
- **Accessibility** compliant components
- **Dark/Light Mode** support (planned)

### Architecture
- **Component-Based Architecture** with reusable UI components
- **State Management** with Zustand
- **Form Handling** with React Hook Form and Yup validation
- **Routing** with React Router DOM
- **API Service Layer** with error handling
- **TypeScript Ready** (can be migrated)

## 🛠 Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling
- **Yup** - Schema validation
- **Framer Motion** - Animation library
- **React Router DOM** - Client-side routing
- **Heroicons** - Icon library

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   ```env
   VITE_API_URL=http://localhost:3001/api/v1
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   └── ui/             # Base UI components
├── layouts/            # Layout components
├── routes/             # Route definitions
├── services/           # API services
├── store/              # State management
└── styles/             # CSS and styling
```

### Component Architecture

- **UI Components** - Reusable, styled components (Button, Input, Card, etc.)
- **Feature Components** - Business logic components (SignIn, Dashboard, etc.)
- **Layout Components** - Page structure components (MainLayout, AuthLayout)
- **Route Protection** - Authentication and authorization guards

## 🔐 Security Features

### Authentication Flow
1. **Sign In/Up** - Secure credential validation
2. **Token Management** - JWT access/refresh token pattern
3. **Auto-Refresh** - Automatic token renewal before expiration
4. **Secure Storage** - Tokens stored securely with appropriate scope

### Role-Based Access
- **Patient Dashboard** - Appointment scheduling, mood tracking, resources
- **Therapist Dashboard** - Patient management, session notes, analytics
- **Admin Dashboard** - User management, platform analytics, system settings

### Security Best Practices
- **Input Validation** - Client and server-side validation
- **XSS Protection** - Sanitized inputs and outputs
- **CSRF Protection** - Token-based request validation
- **Secure Headers** - Security headers for all requests

## 📱 Responsive Design

- **Mobile-First** - Optimized for mobile devices
- **Progressive Enhancement** - Enhanced experience on larger screens
- **Touch-Friendly** - Large touch targets and gestures
- **Performance** - Optimized loading and rendering

## 🎨 Design System

### Colors
- **Primary** - Blue tones for main actions
- **Secondary** - Gray tones for secondary elements
- **Success** - Green for positive actions
- **Warning** - Orange for cautionary actions
- **Error** - Red for error states

### Typography
- **Font Family** - Inter (clean, readable)
- **Font Weights** - 300, 400, 500, 600, 700
- **Responsive Sizing** - Scales across devices

### Components
- **Consistent** - Unified design language
- **Accessible** - WCAG compliant
- **Themeable** - Easy customization

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Set the following environment variables for production:
- `VITE_API_URL` - Production API URL
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID

### Performance Optimization
- **Code Splitting** - Automatic route-based splitting
- **Asset Optimization** - Compressed images and assets
- **Caching** - Optimized caching strategies

## 🧪 Testing

### Test Structure (Planned)
- **Unit Tests** - Component and utility testing
- **Integration Tests** - Feature flow testing
- **E2E Tests** - Full user journey testing

### Testing Tools (To be added)
- Jest - Unit testing
- React Testing Library - Component testing
- Cypress - E2E testing

## 📈 Performance

### Optimization Features
- **Lazy Loading** - Route-based code splitting
- **Memoization** - Optimized re-rendering
- **Bundle Analysis** - Size optimization
- **Service Worker** - Offline capabilities (planned)

### Performance Monitoring
- **Web Vitals** - Core performance metrics
- **Error Tracking** - Runtime error monitoring
- **Analytics** - User behavior insights

## 🔄 State Management

### Zustand Stores
- **Auth Store** - User authentication and profile
- **Toast Store** - Notification management
- **UI Store** - Global UI state (planned)

### Data Flow
1. **API Services** - Centralized API communication
2. **State Updates** - Reactive state management
3. **UI Updates** - Automatic re-rendering

## 🌐 API Integration

### Authentication Endpoints
- `POST /auth/login` - User sign in
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User sign out
- `GET /auth/me` - Current user info

### Error Handling
- **Network Errors** - Connection failure handling
- **API Errors** - Server error responses
- **Validation Errors** - Form validation feedback
- **Authentication Errors** - Token expiration handling

## 📚 Documentation

### Code Documentation
- **Component Props** - TypeScript interfaces (planned)
- **Function Documentation** - JSDoc comments
- **API Documentation** - Service method descriptions

### User Documentation
- **User Guides** - Feature usage guides
- **Help System** - In-app help and support
- **Accessibility** - Screen reader support

## 🤝 Contributing

### Development Workflow
1. **Feature Branches** - Create feature-specific branches
2. **Code Review** - Peer review process
3. **Testing** - Comprehensive testing requirements
4. **Documentation** - Update relevant documentation

### Code Standards
- **ESLint** - Code quality enforcement
- **Prettier** - Code formatting
- **Naming Conventions** - Consistent naming patterns
- **Component Structure** - Standardized component architecture

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🆘 Support

For technical support or questions:
- **Email** - support@timamu.com
- **Documentation** - Internal documentation portal
- **Issue Tracking** - Internal issue tracking system

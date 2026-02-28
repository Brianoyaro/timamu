# Telehealth Frontend

Production-ready React frontend for the telehealth platform.

## 🎨 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS
- **Zustand** - State management
- **React Router v6** - Routing
- **Axios** - HTTP client
- **LiveKit React SDK** - Video conferencing

## 📁 Project Structure

```
src/
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── TherapistDashboard.jsx
│   ├── AdminDashboard.jsx
│   └── VideoSession.jsx
├── components/         # Reusable components
│   ├── TherapistCard.jsx
│   ├── BookingCard.jsx
│   ├── ProtectedRoute.jsx
│   └── Navbar.jsx
├── store/             # Zustand stores
│   ├── authStore.js
│   └── bookingStore.js
├── services/          # API services
│   └── api.js
├── App.jsx            # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Runs on `http://localhost:5173`

### Build

```bash
npm run build
```

Builds to `dist/` folder

### Preview Production Build

```bash
npm run preview
```

## 🔐 Authentication Flow

### Login
1. User submits credentials
2. API call to `/api/auth/login`
3. Token stored in localStorage and Zustand
4. User redirected to role-based dashboard

### Register
1. User fills registration form
2. Anonymous option available for patients
3. Therapists provide license info
4. API call to `/api/auth/register`
5. Auto-login after registration

### Protected Routes
- `ProtectedRoute` component guards routes
- Checks authentication status
- Redirects to login if not authenticated
- Role-based route protection

## 🎯 Pages Overview

### Login Page
- Email/password authentication
- Error handling
- Redirect to role-based dashboard

### Register Page
- Patient/Therapist selection
- Anonymous registration option
- Therapist-specific fields
- Form validation

### Patient Dashboard
- View bookings
- Browse therapists
- Book sessions
- Join video sessions

### Therapist Dashboard
- View bookings
- Manage availability
- Join sessions
- View profile status

### Admin Dashboard
- System metrics
- Therapist approval
- User management
- Booking oversight

### Video Session Page
- LiveKit video room
- Audio/video controls
- Participant management
- Connection status

## 🏪 State Management (Zustand)

### Auth Store
```javascript
import useAuthStore from './store/authStore';

const { user, login, logout, isAuthenticated } = useAuthStore();
```

**State:**
- `user` - Current user object
- `token` - JWT token
- `isAuthenticated` - Boolean auth status
- `isLoading` - Loading state
- `error` - Error messages

**Actions:**
- `login(credentials)` - Login user
- `register(userData)` - Register user
- `logout()` - Logout user
- `fetchUser()` - Refresh user data

### Booking Store
```javascript
import useBookingStore from './store/bookingStore';

const { bookings, createBooking, cancelBooking } = useBookingStore();
```

**State:**
- `bookings` - Array of bookings
- `currentBooking` - Selected booking
- `isLoading` - Loading state
- `error` - Error messages

**Actions:**
- `fetchBookings(params)` - Get bookings
- `createBooking(data)` - Create new booking
- `updateBooking(id, data)` - Update booking
- `cancelBooking(id)` - Cancel booking

## 🔌 API Service Layer

### Usage
```javascript
import { authAPI, bookingsAPI } from './services/api';

// Login
const response = await authAPI.login({ email, password });

// Create booking
const response = await bookingsAPI.create(bookingData);
```

### Interceptors
- **Request:** Adds JWT token to headers
- **Response:** Handles 401 errors (logout)

## 🎨 Styling

### TailwindCSS Classes

**Buttons**
```jsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-danger">Danger</button>
<button className="btn btn-success">Success</button>
```

**Cards**
```jsx
<div className="card">
  {/* Content */}
</div>
```

**Inputs**
```jsx
<input className="input" />
```

**Badges**
```jsx
<span className="badge badge-success">Approved</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-danger">Cancelled</span>
<span className="badge badge-info">Info</span>
```

### Custom Styles
Defined in `src/index.css`:
- Button variants
- Form inputs
- Card component
- Badge variants

## 🎥 LiveKit Integration

### VideoSession Component

```jsx
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

<LiveKitRoom
  token={token}
  serverUrl={serverUrl}
  video={true}
  audio={true}
>
  <VideoConference />
</LiveKitRoom>
```

### Features
- Auto video/audio setup
- Built-in controls
- Participant tiles
- Screen sharing
- Connection management

## 🛡️ Security

### Token Management
- Stored in localStorage
- Included in API headers
- Auto-logout on expiration

### Route Protection
- ProtectedRoute component
- Role-based access
- Automatic redirects

### Input Sanitization
- Form validation
- XSS prevention via React
- API-level validation

## 📱 Responsive Design

Built mobile-first with Tailwind:
- `sm:` - Small screens (640px+)
- `md:` - Medium screens (768px+)
- `lg:` - Large screens (1024px+)
- `xl:` - Extra large (1280px+)

## 🔧 Configuration

### Environment Variables

Create `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Vite Config
- Path aliases configured
- Proxy for API calls in development
- React plugin enabled

### Tailwind Config
- Custom color palette
- Extended theme
- Custom components

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

1. Build: `npm run build`
2. Publish directory: `dist`

### Environment Variables
Set in hosting platform:
- `VITE_API_URL` - Production API URL

## 🧪 Development Tips

### Hot Module Replacement
Vite provides instant HMR for React components

### Component Development
```bash
# Create new component
touch src/components/YourComponent.jsx
```

### Adding New Page
1. Create page in `src/pages/`
2. Add route in `App.jsx`
3. Add to navigation if needed

### State Management
1. Add actions to Zustand store
2. Use hooks in components
3. Handle loading/error states

## 📊 Performance

### Optimizations
- Code splitting via React.lazy
- Vite's optimized build
- Tree shaking
- Asset optimization

### Best Practices
- Avoid inline function definitions
- Memoize expensive computations
- Use React.memo for pure components
- Lazy load heavy components

## 🐛 Troubleshooting

### API Connection Issues
- Check VITE_API_URL
- Verify backend is running
- Check CORS settings

### Authentication Issues
- Clear localStorage
- Check token expiration
- Verify API credentials

### Build Errors
- Clear node_modules and reinstall
- Check for missing dependencies
- Verify environment variables

### LiveKit Connection Issues
- Verify token generation
- Check LiveKit server URL
- Browser permissions for camera/mic

## 📚 Component Examples

### Using Auth Store
```jsx
import useAuthStore from './store/authStore';

function MyComponent() {
  const { user, logout } = useAuthStore();
  
  return (
    <div>
      <p>Welcome, {user.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Page
```jsx
import ProtectedRoute from './components/ProtectedRoute';

<Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Making API Call
```jsx
import { bookingsAPI } from './services/api';

async function createBooking(data) {
  try {
    const response = await bookingsAPI.create(data);
    console.log('Booking created:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
}
```

## 🎯 Features Checklist

- [x] User authentication
- [x] Role-based routing
- [x] Patient dashboard
- [x] Therapist dashboard
- [x] Admin dashboard
- [x] Booking system
- [x] Video sessions
- [x] Responsive design
- [x] Error handling
- [x] Loading states

## 🔄 Future Enhancements

Potential features to add:
- Real-time notifications
- Chat functionality
- Session recording
- Payment integration
- Email notifications
- Calendar integration
- Advanced search/filters
- User reviews/ratings

## 📝 Code Style

### Component Structure
```jsx
import React, { useState, useEffect } from 'react';

export default function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Side effects
  }, []);
  
  const handleAction = () => {
    // Event handler
  };
  
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
```

### Naming Conventions
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_CASE
- Files: PascalCase for components

## 📖 Additional Resources

- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind Docs](https://tailwindcss.com/)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [React Router Docs](https://reactrouter.com/)
- [LiveKit React Docs](https://docs.livekit.io/client-sdks/react/)

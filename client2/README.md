# Timamu Client 2 - Modern Mental Health Platform

A refined, professional mental health platform built with modern React technologies. This is an improved version of the original frontend with simplified architecture and enhanced UX.

## 🚀 Features

- **Modern UI/UX**: Built with MUI, ShadCN, and Radix UI components
- **Streamlined Booking**: Simplified therapist booking flow directly from therapist detail pages
- **Role-based Access**: Support for patients, therapists, and administrators
- **Multi-tenant Architecture**: Support for multiple organizations
- **Professional Design**: Clean, intuitive interface focused on user experience
- **Responsive**: Mobile-first design that works on all devices

## 🛠 Tech Stack

- **Frontend Framework**: React 18 with Vite
- **Styling**: TailwindCSS with custom design system
- **UI Components**: 
  - Material-UI (MUI) for core components
  - ShadCN for custom UI elements
  - Radix UI for accessible primitives
- **Icons**: Lucide React
- **State Management**: Zustand with persistence
- **API Layer**: React Query for data fetching
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Build Tool**: Vite with path aliases

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components (Button, Card, Input, etc.)
│   ├── auth/              # Authentication components
│   ├── scheduling/        # Booking and calendar components
│   └── tenant/            # Multi-tenant components
├── layouts/
│   ├── AppLayout.jsx      # Main app layout with navigation
│   └── AuthLayout.jsx     # Authentication pages layout
├── pages/
│   ├── DashboardPage.jsx  # Role-based dashboard
│   ├── TherapistListPage.jsx
│   ├── TherapistDetailPage.jsx  # Main booking interface
│   ├── AppointmentsPage.jsx
│   ├── auth/              # Sign in, sign up, forgot password
│   └── admin/             # Admin pages
├── services/
│   ├── apiService.js      # Centralized API client
│   ├── authService.js     # Authentication API calls
│   ├── userService.js     # User management
│   └── schedulingService.js # Appointment booking
├── stores/
│   ├── authStore.js       # Authentication state
│   ├── tenantStore.js     # Multi-tenant state
│   └── toastStore.js      # Notification state
├── hooks/
│   └── useToast.js        # Toast notification hook
└── lib/
    └── utils.js           # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
cd /home/brian/timamu/client2
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Timamu
```

### Path Aliases
The project uses Vite path aliases configured in `vite.config.js`:
- `@/*` maps to `src/*`

## 🎯 Key Improvements from Original Frontend

1. **Simplified Booking Flow**: 
   - Removed complex therapist search
   - Direct booking from therapist detail page
   - Streamlined calendar interface

2. **Modern Component Architecture**:
   - ShadCN-style UI components
   - Consistent design system
   - Reusable, composable components

3. **Enhanced State Management**:
   - Zustand for simpler state management
   - Persistent stores for auth and tenant data
   - Centralized toast notifications

4. **Professional Design**:
   - Clean, modern interface
   - Consistent spacing and typography
   - Accessible color scheme
   - Mobile-responsive design

5. **Better Developer Experience**:
   - TypeScript-ready component patterns
   - Path aliases for clean imports
   - ESLint configuration
   - Hot module replacement

## 📱 User Flows

### Patient Journey
1. **Sign Up/Sign In**: Simple authentication flow
2. **Browse Therapists**: Filter by specialization, rating, location
3. **View Therapist Details**: See credentials, approach, reviews
4. **Book Appointment**: Select time slot directly from therapist page
5. **Manage Appointments**: View upcoming and past sessions
6. **Profile Management**: Update personal information

### Therapist Journey
1. **Professional Profile**: Manage credentials and specializations
2. **Availability Management**: Set available time slots
3. **Appointment Management**: View and manage client sessions
4. **Client Communication**: Secure messaging (coming soon)

### Admin Journey
1. **System Overview**: Monitor platform usage and health
2. **User Management**: Manage user accounts and roles
3. **Analytics**: Track appointments and platform metrics (coming soon)

## 🛡 Security & Privacy

- Role-based access control
- Secure authentication with JWT
- Multi-tenant data isolation
- HIPAA-compliant design considerations

## 🚧 Roadmap

- [ ] Advanced messaging system
- [ ] Video calling integration
- [ ] Payment processing
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered therapist matching

## 📄 License

This project is part of the Timamu mental health platform.

## 🤝 Contributing

Please follow the established patterns and component structure when adding new features.

---

Built with ❤️ for mental health accessibility

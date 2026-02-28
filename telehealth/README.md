# Telehealth Platform - Complete Production-Ready Application

A comprehensive telepsychology platform connecting patients with therapists through secure video sessions.

## 🚀 Features

### Core Functionality
- **Anonymous Patient Registration** - Patients can register without providing name/email
- **Therapist Onboarding** - NGO and County Government partnership support
- **Admin Approval Workflow** - Therapist accounts require admin approval
- **Booking System** - Patients can book sessions with approved therapists
- **Secure Video Sessions** - LiveKit-powered video conferencing
- **Role-Based Access Control** - Patient, Therapist, and Admin roles

### Technology Stack

#### Backend
- Node.js with Express.js
- MySQL database
- Prisma ORM
- JWT authentication
- bcrypt password hashing
- Zod validation
- LiveKit server SDK
- Docker support

#### Frontend
- React 18 with Vite
- TailwindCSS
- Zustand state management
- React Router v6
- Axios for API calls
- LiveKit React SDK

## 📁 Project Structure

```
telehealth/
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── therapists/
│   │   │   ├── bookings/
│   │   │   ├── sessions/
│   │   │   ├── admin/
│   │   │   └── notifications/
│   │   ├── middleware/       # Auth, role, error handling
│   │   ├── utils/           # JWT, hash, LiveKit helpers
│   │   ├── config/          # Database configuration
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Seed data
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/           # Page components
    │   ├── components/      # Reusable components
    │   ├── store/          # Zustand stores
    │   ├── services/       # API service layer
    │   ├── App.jsx         # Main app component
    │   └── main.jsx        # Entry point
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- Docker & Docker Compose (optional)

### Option 1: Local Development

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL` - MySQL connection string
   - `JWT_SECRET` - Your JWT secret key
   - `LIVEKIT_API_KEY` - LiveKit API key
   - `LIVEKIT_API_SECRET` - LiveKit API secret
   - `LIVEKIT_URL` - LiveKit server URL

4. **Run database migrations**
   ```bash
   npm run migrate
   ```

5. **Seed database with sample data**
   ```bash
   npm run seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Backend will run on `http://localhost:5000`

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

Frontend will run on `http://localhost:5173`

### Option 2: Docker Deployment

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

This will start:
- MySQL database
- Redis
- LiveKit server
- Backend API

3. **Run migrations**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

4. **Seed database**
   ```bash
   docker-compose exec backend npm run seed
   ```

## 🔐 Default Accounts (After Seeding)

### Admin
- Email: `admin@telehealth.com`
- Password: `admin123`

### Therapist
- Email: `therapist@example.com`
- Password: `therapist123`

### Patient
- Email: `patient@example.com`
- Password: `patient123`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password
- `DELETE /api/users/account` - Delete account

### Therapists
- `GET /api/therapists` - List approved therapists (public)
- `GET /api/therapists/:id` - Get therapist details
- `GET /api/therapists/me` - Get own profile (therapist)
- `PUT /api/therapists/me` - Update profile (therapist)
- `PUT /api/therapists/availability` - Update availability

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/cancel` - Cancel booking

### Sessions
- `POST /api/sessions/:bookingId/start` - Start video session
- `GET /api/sessions/:bookingId/token` - Get LiveKit token
- `POST /api/sessions/:bookingId/end` - End session
- `GET /api/sessions/:bookingId` - Get session details

### Admin
- `GET /api/admin/metrics` - Get system metrics
- `GET /api/admin/users` - List all users
- `GET /api/admin/therapists` - List all therapists
- `PUT /api/admin/therapists/:id/approval` - Approve/reject therapist
- `GET /api/admin/bookings` - List all bookings

## 🎯 User Flows

### Patient Flow
1. Register (anonymous or with details)
2. Browse approved therapists
3. Book a session
4. Join video session at scheduled time
5. View session history

### Therapist Flow
1. Register with credentials and license
2. Wait for admin approval
3. Set availability schedule
4. View and manage bookings
5. Join sessions with patients
6. Mark sessions as completed

### Admin Flow
1. Access admin dashboard
2. View system metrics
3. Review pending therapist applications
4. Approve or reject therapists
5. Monitor bookings and users

## 🔒 Security Features

- JWT-based authentication
- bcrypt password hashing
- Role-based access control
- Rate limiting
- Helmet security headers
- CORS configuration
- Zod input validation
- SQL injection protection (Prisma)
- XSS protection

## 🎥 LiveKit Video Integration

The platform uses LiveKit for secure, high-quality video sessions:

- Token-based access control
- Peer-to-peer connections when possible
- Automatic fallback to relay servers
- Audio/video controls
- Screen sharing support (built into LiveKit components)

## 🚀 Production Deployment

### Backend Deployment

1. Set production environment variables
2. Build and deploy Docker container
3. Run database migrations
4. Configure reverse proxy (nginx)
5. Set up SSL certificates
6. Configure LiveKit server

### Frontend Deployment

1. Update API URL in `.env`
2. Build production bundle: `npm run build`
3. Deploy `dist` folder to static hosting (Vercel, Netlify, etc.)
4. Configure custom domain

## 📝 Development Notes

### Database Schema
- Users table with role-based access
- Therapist profiles with approval status
- Bookings with status tracking
- Sessions linked to bookings

### State Management
- Zustand for global state
- Persistent auth storage
- Optimistic UI updates

### Error Handling
- Centralized error middleware
- User-friendly error messages
- Proper HTTP status codes

## 🤝 Contributing

This is a production-ready codebase. To extend:

1. Add new modules in `backend/src/modules/`
2. Create corresponding API services in `frontend/src/services/`
3. Follow existing patterns for consistency
4. Update documentation

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues or questions:
1. Check the documentation
2. Review API endpoints
3. Check browser console for frontend errors
4. Check server logs for backend errors

## 🎉 Acknowledgments

Built with:
- Express.js
- React
- Prisma
- LiveKit
- TailwindCSS
- And many other open-source projects

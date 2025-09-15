# Telepsychology Platform - Backend

A production-grade Node.js backend for a comprehensive telepsychology platform supporting patients, therapists, and administrators.

## 🚀 Features

- **Authentication & Authorization**: JWT with refresh tokens, Google OAuth, role-based access control
- **Real-time Communication**: Socket.IO for video conferencing, live chat, and notifications
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Security**: Comprehensive middleware stack with rate limiting, input validation, and audit logging
- **File Management**: Secure file upload/download with encryption
- **Email Services**: Automated notifications and communications
- **Audit Logging**: Complete activity tracking for compliance

## 🛠️ Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, Passport.js, Google OAuth
- **Real-time**: Socket.IO
- **Validation**: Joi and Zod schemas
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston with file rotation
- **Testing**: Jest with Supertest

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

## 🔧 Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd Backend
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

4. **Initialize database**
   ```bash
   npm run db:init
   ```

## ⚙️ Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/telepsychology"

# JWT Secrets (use strong, unique values)
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Server Configuration
PORT=5000
NODE_ENV=development

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Configuration (optional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# File Storage
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=10485760

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## 🗄️ Database Setup

### Quick Start
```bash
# Initialize database with migrations and seeding
npm run db:init

# Or run commands separately:
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database  
npm run db:seed        # Seed with sample data
```

### Database Management
```bash
npm run db:studio      # Open Prisma Studio (GUI)
npm run db:migrate     # Create and apply new migration
npm run db:reset       # Reset database (WARNING: deletes all data)
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev            # Start with nodemon (auto-restart)
```

### Production Mode
```bash
npm start              # Start production server
```

### Other Commands
```bash
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run logs           # View application logs
```

## 📁 Project Structure

```
Backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── passport.js  # Google OAuth configuration
│   ├── middleware/      # Express middleware
│   │   ├── authMiddleware.js    # Authentication & authorization
│   │   ├── errorMiddleware.js   # Error handling
│   │   └── validation.js        # Input validation schemas
│   ├── routes/          # API route handlers
│   │   ├── auth.js      # Authentication routes
│   │   ├── users.js     # User management
│   │   ├── sessions.js  # Therapy sessions
│   │   ├── messages.js  # Real-time messaging
│   │   ├── files.js     # File upload/download
│   │   └── admin.js     # Admin operations
│   ├── sockets/         # WebSocket handlers
│   │   └── socketHandler.js # Real-time communication
│   ├── utils/           # Utility modules
│   │   ├── database.js  # Database connection
│   │   ├── logger.js    # Winston logging
│   │   ├── jwt.js       # JWT utilities
│   │   ├── email.js     # Email services
│   │   └── audit.js     # Audit logging
│   ├── scripts/         # Utility scripts
│   │   ├── seed.js      # Database seeding
│   │   └── init-db.js   # Database initialization
│   └── server.js        # Main application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── logs/                # Application logs
├── uploads/             # File uploads
├── .env                 # Environment variables
├── .env.example         # Environment template
└── package.json         # Dependencies and scripts
```

## 👥 User Roles & Permissions

### Patients
- Register/login with email or Google OAuth
- Complete health assessments and onboarding
- Book therapy sessions with available therapists
- Join video calls and participate in secure messaging
- Upload/download session-related files
- View session history and notes

### Therapists
- Professional registration with credential verification
- Set availability and manage appointment calendar
- Conduct video therapy sessions with integrated tools
- Access patient profiles and session histories
- Generate session notes and treatment plans
- Manage secure file sharing with patients

### Admins
- Full platform oversight and user management
- Review and approve therapist applications
- Generate comprehensive analytics and reports
- Monitor system health and audit logs
- Configure platform settings and policies
- Handle support tickets and platform issues

## 🔐 Security Features

- **Authentication**: JWT with automatic refresh token rotation
- **Authorization**: Role-based access control (RBAC) with granular permissions
- **Input Validation**: Comprehensive validation using Joi schemas
- **Rate Limiting**: Configurable rate limiting per endpoint
- **Audit Logging**: Complete activity tracking for compliance (HIPAA)
- **File Security**: Encrypted file storage with access controls
- **Password Security**: bcrypt hashing with configurable rounds
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-avatar` - Upload profile picture
- `GET /api/users/therapists` - List available therapists

### Sessions
- `GET /api/sessions` - Get user sessions
- `POST /api/sessions` - Book new session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Cancel session
- `POST /api/sessions/:id/join` - Join session
- `POST /api/sessions/:id/notes` - Add session notes

### Messages
- `GET /api/messages/:sessionId` - Get session messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Download file
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/session/:sessionId` - Get session files

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/analytics` - Platform analytics
- `GET /api/admin/audit-logs` - Audit logs

## 🔌 WebSocket Events

### Video Conferencing
- `join-session` - Join therapy session room
- `leave-session` - Leave session room
- `offer`, `answer`, `ice-candidate` - WebRTC signaling

### Real-time Chat
- `send-message` - Send chat message
- `message-received` - Receive new message
- `typing-start`, `typing-stop` - Typing indicators

### Notifications
- `session-reminder` - Session reminders
- `session-started` - Session start notifications
- `user-status-changed` - User presence updates

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📊 Monitoring & Logging

- **Application Logs**: Winston with file rotation in `logs/` directory
- **Audit Logs**: Database-stored audit trail for all user actions
- **Error Tracking**: Comprehensive error logging with stack traces
- **Performance Monitoring**: Request timing and database query logging

## 🚀 Deployment

### Production Checklist
1. Set `NODE_ENV=production` in environment
2. Configure secure JWT secrets (use `openssl rand -hex 32`)
3. Set up production PostgreSQL database
4. Configure email service (SendGrid, AWS SES, etc.)
5. Set up file storage (AWS S3, Google Cloud Storage)
6. Configure reverse proxy (nginx) with SSL
7. Set up monitoring and alerting
8. Configure backup strategies

### Environment-specific Configurations
- **Development**: Local PostgreSQL, file storage, detailed logging
- **Staging**: Cloud database, cloud storage, production-like setup
- **Production**: High-availability database, CDN, comprehensive monitoring

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Ensure all tests pass before submitting PRs
5. Follow semantic versioning for releases

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This is a production-grade healthcare application. Ensure compliance with relevant regulations (HIPAA, GDPR, etc.) in your deployment environment.

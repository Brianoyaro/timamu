# MindLink Backend API

A comprehensive backend API for the MindLink telepsychology platform built with Node.js, Express, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd mindlink-backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/mindlink_db"
JWT_ACCESS_SECRET="your-super-secret-jwt-access-key"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key"
FRONTEND_URL="http://localhost:5173"
```

3. **Set up database:**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

4. **Start development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 📋 Demo Accounts

After seeding, you can use these accounts:

- **Admin**: `admin@mindlink.com` / `admin123!`
- **Therapist**: `sarah.johnson@mindlink.com` / `therapist123!`
- **Patient**: `john.doe@example.com` / `patient123!`

## 🏗️ Architecture

### Database Schema

The application uses a multi-tenant PostgreSQL database with the following main entities:

- **Tenants**: Clinic organizations with their own users and data
- **Users**: Patients, therapists, and admins with role-based access
- **Sessions**: Video therapy sessions with WebRTC signaling
- **Appointments**: Scheduled therapy appointments
- **Messages**: Secure messaging between patients and therapists
- **Assessments**: Mental health questionnaires (PHQ-9, GAD-7)
- **Audit Logs**: Complete audit trail for compliance

### API Structure

```
src/
├── routes/           # API route handlers
│   ├── auth.js      # Authentication endpoints
│   ├── tenants.js   # Tenant management
│   ├── users.js     # User profiles and management
│   ├── sessions.js  # Video sessions and WebRTC
│   ├── appointments.js # Scheduling and appointments
│   ├── messaging.js # Secure messaging
│   ├── assessments.js # Mental health assessments
│   └── admin.js     # Admin console endpoints
├── middleware/       # Express middleware
│   ├── auth.js      # JWT authentication
│   ├── tenant.js    # Multi-tenancy
│   ├── validation.js # Input validation
│   ├── auditLog.js  # Audit logging
│   └── errorHandler.js # Error handling
├── utils/           # Utility functions
│   ├── jwt.js       # JWT token management
│   ├── password.js  # Password hashing
│   └── email.js     # Email sending
└── server.js        # Express app setup
```

## 🔐 Authentication & Authorization

### JWT Tokens
- **Access Token**: Short-lived (15 minutes) for API access
- **Refresh Token**: Long-lived (7 days) for token renewal
- **Reset Token**: One-time use for password resets

### Roles
- **Patient**: Can book appointments, join sessions, send messages
- **Therapist**: Can manage availability, conduct sessions, take notes
- **Admin**: Full system access, tenant management, user administration

### Multi-Tenancy
All API requests (except auth) require `x-tenant-id` header. Users can only access data within their tenant unless they have admin role.

## 📡 API Endpoints

### Authentication
```
POST /api/v1/auth/register     # User registration
POST /api/v1/auth/login        # User login
POST /api/v1/auth/refresh      # Refresh access token
POST /api/v1/auth/logout       # User logout
POST /api/v1/auth/forgot-password # Request password reset
POST /api/v1/auth/reset-password  # Reset password
GET  /api/v1/auth/me          # Get current user
```

### Tenants
```
GET    /api/v1/tenants         # List user's tenants
GET    /api/v1/tenants/:id     # Get tenant details
POST   /api/v1/tenants         # Create tenant (admin)
PATCH  /api/v1/tenants/:id     # Update tenant
DELETE /api/v1/tenants/:id     # Delete tenant
GET    /api/v1/tenants/:id/users # Get tenant users
```

### Users
```
GET    /api/v1/users           # List users (with filters)
GET    /api/v1/users/:id       # Get user details
PATCH  /api/v1/users/:id       # Update user profile
PATCH  /api/v1/users/:id/roles # Update user roles (admin)
POST   /api/v1/users/me/avatar # Upload avatar
POST   /api/v1/users/me/data-export # Request data export
POST   /api/v1/users/me/data-delete # Request account deletion
```

### Sessions & Video
```
GET    /api/v1/sessions        # List sessions
POST   /api/v1/sessions        # Create session
GET    /api/v1/sessions/:id    # Get session details
POST   /api/v1/sessions/:id/join # Join session
POST   /api/v1/sessions/:id/end  # End session
POST   /api/v1/sessions/:id/signal # WebRTC signaling
GET    /api/v1/sessions/:id/signals # Get WebRTC signals
POST   /api/v1/sessions/:id/admit  # Admit patient (therapist)
GET    /api/v1/sessions/:id/notes  # Get session notes
POST   /api/v1/sessions/:id/notes  # Create session note
PATCH  /api/v1/sessions/:sessionId/notes/:noteId # Update note
```

### Appointments
```
GET    /api/v1/appointments     # List appointments
POST   /api/v1/appointments     # Create appointment
GET    /api/v1/appointments/:id # Get appointment
PATCH  /api/v1/appointments/:id # Update appointment
DELETE /api/v1/appointments/:id # Delete appointment
GET    /api/v1/appointments/therapists/:id/availability # Get availability
POST   /api/v1/appointments/therapists/:id/availability # Set availability
```

### Messaging
```
GET    /api/v1/threads         # List message threads
POST   /api/v1/threads         # Create thread
GET    /api/v1/threads/:id     # Get thread details
GET    /api/v1/threads/:id/messages # Get messages
POST   /api/v1/threads/:id/messages # Send message
POST   /api/v1/threads/:id/attachments # Upload attachment
PATCH  /api/v1/threads/:threadId/messages/:messageId/read # Mark as read
```

### Assessments
```
GET    /api/v1/assessments     # List assessments
POST   /api/v1/assessments     # Submit assessment
GET    /api/v1/assessments/history # Get assessment history
GET    /api/v1/assessments/mood-checkins # Get mood check-ins
POST   /api/v1/assessments/mood-checkins # Submit mood check-in
```

### Admin
```
GET    /api/v1/admin/audit-logs # Get audit logs
GET    /api/v1/admin/stats     # Get system statistics
GET    /api/v1/admin/health    # Get system health
```

## 🔒 Security Features

### Input Validation
- All endpoints use express-validator for input sanitization
- SQL injection prevention through Prisma ORM
- XSS protection with helmet.js

### Rate Limiting
- Global rate limiting: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes
- Configurable via environment variables

### Password Security
- bcrypt hashing with configurable rounds (default: 12)
- Password strength validation
- Secure password reset flow

### CORS Configuration
- Restricted to frontend domain only
- Credentials support for cookies/auth headers
- Configurable allowed methods and headers

## 🏥 Compliance Features

### Audit Logging
All user actions are automatically logged with:
- Action type and details
- User and tenant information
- IP address and user agent
- Timestamp

### Data Privacy
- GDPR-compliant data export endpoint
- Account deletion request handling
- Session recording consent tracking
- PHI (Protected Health Information) handling

### Multi-Tenancy
- Complete data isolation between tenants
- Tenant-scoped queries and operations
- Admin cross-tenant access controls

## 🧪 Development

### Database Operations
```bash
# Generate Prisma client after schema changes
npm run db:generate

# Apply schema changes to database
npm run db:push

# Create and apply migrations
npm run db:migrate

# Reset database and reseed
npm run db:reset

# Seed database with demo data
npm run db:seed
```

### Environment Variables
```env
# Required
DATABASE_URL="postgresql://..."
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."

# Optional
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
BCRYPT_ROUNDS=12
```

### Testing API Endpoints

You can test the API using curl or any HTTP client:

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"patient123!"}'

# Get user profile (with auth token)
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🚀 Production Deployment

### Environment Setup
1. Set strong JWT secrets
2. Configure production database
3. Set up SMTP for email sending
4. Configure file storage (AWS S3, etc.)
5. Set up monitoring and logging

### Security Checklist
- [ ] Change default JWT secrets
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Set up monitoring alerts

### Scaling Considerations
- Database connection pooling
- Redis for session storage
- File upload to cloud storage
- Load balancing for multiple instances
- WebRTC signaling server scaling

## 📊 Monitoring

### Health Endpoints
- `GET /health` - Basic health check
- `GET /api/v1/admin/health` - Detailed system health (admin only)

### Metrics to Monitor
- Response times
- Error rates
- Database connection pool
- Memory usage
- Active sessions
- Failed login attempts

## 🔧 Configuration

### Email Templates
Email templates are defined in `src/utils/email.js`. Customize the HTML and text content for:
- Welcome emails
- Password reset emails
- Appointment reminders (future feature)

### File Uploads
Configure file upload settings in `.env`:
```env
MAX_FILE_SIZE="10MB"
UPLOAD_PATH="./uploads"
```

In production, integrate with cloud storage providers.

### Rate Limiting
Adjust rate limiting in `.env`:
```env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Max requests per window
LOGIN_RATE_LIMIT_MAX=5         # Max login attempts
```

## 🤝 Integration with Frontend

This backend is designed to work seamlessly with the MindLink React frontend. The API follows RESTful conventions and returns consistent JSON responses:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### CORS Configuration
The backend is configured to accept requests from your frontend URL. Update `FRONTEND_URL` in `.env` to match your frontend deployment.

### WebRTC Signaling
The backend provides WebRTC signaling endpoints for video sessions:
- Store and relay SDP offers/answers
- Handle ICE candidate exchange
- Manage session state

## 📝 License

This project is licensed under the ISC License.

---

**Note**: This is a backend API only. Pair with the MindLink React frontend for a complete telepsychology platform.

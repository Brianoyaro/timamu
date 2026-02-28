# Telehealth Backend

Production-ready Node.js backend for the telehealth platform.

## 🏗️ Architecture

**Modular Monolith Pattern**
- Feature-based modules
- Centralized middleware
- Shared utilities
- Clean separation of concerns

## 📦 Modules

### Auth Module
- User registration (anonymous option)
- JWT authentication
- Login/logout
- Password hashing with bcrypt

### Users Module
- Profile management
- Password changes
- Account deletion

### Therapists Module
- Therapist profile creation
- Availability management
- Public listing (approved only)
- Profile updates

### Bookings Module
- Create bookings
- List bookings (filtered by user)
- Cancel bookings
- Booking validation

### Sessions Module
- LiveKit room creation
- Token generation
- Session management
- Video session lifecycle

### Admin Module
- System metrics
- User management
- Therapist approval workflow
- Booking oversight

### Notifications Module
- Email notifications (framework)
- SMS notifications (framework)
- Extensible notification system

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/telehealth"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# LiveKit
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
LIVEKIT_URL=ws://localhost:7880

# CORS
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🗄️ Database

### Prisma Setup

```bash
# Generate Prisma Client
npm run generate

# Create migration
npx prisma migrate dev --name init

# Deploy migration
npm run migrate:deploy

# Open Prisma Studio
npm run studio
```

### Schema Overview

**User**
- id, name, email, phone, password, role
- Relations: therapistProfile, bookings

**TherapistProfile**
- userId, specialization, licenseNumber, bio
- isApproved, availability (JSON)

**Booking**
- patientId, therapistId, scheduledAt
- status (SCHEDULED | COMPLETED | CANCELLED)
- notes

**Session**
- bookingId, livekitRoom
- startedAt, endedAt

## 🛡️ Security

### Authentication Flow
1. User provides credentials
2. Server validates and hashes password
3. JWT token generated and returned
4. Client includes token in Authorization header
5. authMiddleware validates token on protected routes

### Role-Based Access
- `authMiddleware` - Validates JWT token
- `roleMiddleware` - Checks user role
- Protected routes use both middlewares

### Input Validation
- Zod schemas for all inputs
- Automatic validation error handling
- Type-safe request bodies

## 🚦 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ] // For validation errors
}
```

## 📊 Error Handling

### Global Error Handler
- Catches all errors
- Formats error responses
- Logs errors in development
- Sanitizes errors in production

### Custom Errors
```javascript
throw new AppError('Custom error message', 404);
```

## 🔌 LiveKit Integration

### Token Generation
```javascript
import { generateLiveKitToken } from './utils/livekit.js';

const token = generateLiveKitToken(roomName, participantName, participantId);
```

### Room Management
- Rooms created automatically
- Unique room per booking
- Token-based access control

## 🐳 Docker Support

### Docker Compose Services
- MySQL database
- Redis cache
- LiveKit server
- Backend API

### Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild services
docker-compose up -d --build
```

## 🧪 Testing

### Manual Testing with cURL

**Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "role": "PATIENT"
  }'
```

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

## 🔄 Middleware Stack

1. **Helmet** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Rate Limiting** - DDoS prevention
4. **Body Parser** - JSON parsing
5. **Auth Middleware** - JWT validation
6. **Role Middleware** - Permission checking
7. **Error Handler** - Centralized error handling

## 📈 Performance

### Optimizations
- Prisma query optimization
- Connection pooling
- Index optimization in database
- Rate limiting to prevent abuse

### Monitoring
- Health check endpoint: `/health`
- Structured logging
- Error tracking

## 🚀 Deployment Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure production database
- [ ] Set up LiveKit server
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set appropriate rate limits
- [ ] Set NODE_ENV=production
- [ ] Run database migrations
- [ ] Seed admin account
- [ ] Configure logging service
- [ ] Set up monitoring
- [ ] Configure backups

## 📝 Development Tips

### Adding New Module
1. Create folder in `src/modules/your-module/`
2. Create controller: `your-module.controller.js`
3. Create routes: `your-module.routes.js`
4. Import routes in `app.js`

### Adding New Model
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_migration`
3. Prisma Client auto-updates

### Adding Validation
```javascript
import { z } from 'zod';

const schema = z.object({
  field: z.string().min(1),
});

const validated = schema.parse(req.body);
```

## 🐛 Troubleshooting

### Database Connection Failed
- Verify MySQL is running
- Check DATABASE_URL format
- Ensure database exists

### Prisma Errors
- Run `npm run generate`
- Check Prisma schema syntax
- Verify migrations applied

### LiveKit Connection Issues
- Verify LIVEKIT_URL is correct
- Check API key/secret
- Ensure LiveKit server is running

## 📚 Additional Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Docs](https://expressjs.com/)
- [LiveKit Docs](https://docs.livekit.io/)
- [Zod Docs](https://zod.dev/)

# Telepsychology Platform

A **production-grade full-stack telepsychology platform** with three user roles: **patients**, **therapists**, and **administrators**. Built with modern web technologies for secure, scalable healthcare delivery.

## 🎯 Project Overview

This platform enables secure video therapy sessions, appointment booking, patient management, and administrative oversight. It's designed to meet healthcare compliance requirements while providing an excellent user experience across all device types.

## 🏗️ Architecture

```
telepsychology-platform/
├── Backend/                 # Node.js + Express API server
├── Frontend/                # React + Vite client application
└── docs/                    # Documentation and deployment guides
```

### Tech Stack

**Frontend**:
- React 19 with Vite
- Zustand for state management
- Tailwind CSS for styling
- WebRTC for video conferencing
- Socket.IO for real-time features

**Backend**:
- Node.js with Express.js
- PostgreSQL with Prisma ORM
- JWT authentication
- Socket.IO for real-time communication
- WebRTC signaling server

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telepsychology-platform
   ```

2. **Set up the backend**
   ```bash
   cd Backend
   npm install
   cp .env.example .env
   # Configure your database and environment variables
   npm run migrate
   npm run seed
   npm run dev
   ```

3. **Set up the frontend**
   ```bash
   cd Frontend
   npm install
   cp .env.example .env
   # Configure API endpoint
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## 👥 User Roles & Features

### 🏥 Patients
- **Profile Management**: Update personal information and preferences
- **Therapist Discovery**: Browse and filter licensed therapists by specialty
- **Session Booking**: Schedule appointments with preferred therapists
- **Video Therapy**: Secure video sessions with end-to-end encryption
- **File Sharing**: Upload/download medical documents securely
- **Session History**: View past sessions and notes
- **Real-time Chat**: Secure messaging with therapists

### 👨‍⚕️ Therapists
- **Professional Dashboard**: Manage patient caseload and schedule
- **Availability Management**: Set working hours and time slots
- **Session Management**: Conduct video therapy with integrated tools
- **Patient Notes**: Document session notes and treatment plans
- **File Management**: Secure document exchange with patients
- **Billing Interface**: Track earnings and payment information
- **Calendar Integration**: Sync with external calendar systems

### 🔐 Administrators
- **User Management**: Approve therapists, manage user accounts
- **Analytics Dashboard**: Platform usage and performance metrics
- **Audit Logs**: Security monitoring and compliance tracking
- **Content Moderation**: Review and moderate platform content
- **System Monitoring**: Server health and performance tracking
- **Billing Management**: Subscription and payment oversight

## 🔑 Key Features

### Security & Compliance
- **HIPAA Compliant**: Healthcare data protection standards
- **End-to-End Encryption**: Secure video calls and messaging
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Audit Logging**: Comprehensive activity tracking
- **Data Encryption**: Encrypted file storage and transmission

### Communication
- **WebRTC Video Calls**: High-quality peer-to-peer video
- **Real-time Chat**: Instant messaging during sessions
- **Screen Sharing**: Share documents and presentations
- **Session Recording**: Optional encrypted session recording
- **Notifications**: Email and in-app notifications
- **Multi-language Support**: English and additional languages

### User Experience
- **Responsive Design**: Mobile-first, works on all devices
- **Dark/Light Mode**: User preference themes
- **Accessibility**: WCAG 2.1 AA compliance
- **Progressive Web App**: Install as native app
- **Offline Support**: Basic functionality without internet
- **Performance Optimized**: Fast loading and smooth interactions

## 📊 Technical Features

### Real-time Communication
- Socket.IO for instant messaging
- WebRTC for video conferencing
- Presence indicators
- Typing indicators
- Connection quality monitoring

### Data Management
- PostgreSQL with Prisma ORM
- Automated database migrations
- Data backup and recovery
- GDPR compliance tools
- Data retention policies

### API & Integration
- RESTful API design
- OpenAPI/Swagger documentation
- Third-party integrations (calendars, payments)
- Webhook support
- Rate limiting and security

## 🛡️ Security

### Authentication & Authorization
- JWT with refresh tokens
- Google OAuth integration
- Multi-factor authentication (planned)
- Password strength requirements
- Account lockout protection

### Data Protection
- AES-256 encryption at rest
- TLS 1.3 for data in transit
- Secure file upload/download
- CORS and CSP policies
- Input validation and sanitization

## 📱 Device Support

- **Desktop**: Windows, macOS, Linux
- **Mobile**: iOS Safari, Android Chrome
- **Tablets**: iPad, Android tablets
- **Browsers**: Chrome, Firefox, Safari, Edge

## 🚀 Deployment

### Development
```bash
# Start backend
cd Backend && npm run dev

# Start frontend
cd Frontend && npm run dev
```

### Production
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: AWS EC2, Google Cloud, or DigitalOcean
- **Database**: AWS RDS, Google Cloud SQL, or managed PostgreSQL
- **CDN**: CloudFlare for global content delivery

## 📋 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/telepsychology
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
EMAIL_SERVICE_API_KEY=your-email-service-key
UPLOAD_SECRET_KEY=your-file-encryption-key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-id
VITE_APP_NAME=TelePsy
```

## 🧪 Testing

```bash
# Backend tests
cd Backend && npm test

# Frontend tests
cd Frontend && npm test

# End-to-end tests
npm run test:e2e
```

## 📚 Documentation

- [API Documentation](./Backend/docs/api.md)
- [Frontend Guide](./Frontend/README.md)
- [Backend Guide](./Backend/README.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Guide](./docs/security.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@telepsy.com or create an issue in the repository.

---

**⚠️ Healthcare Compliance Notice**: This platform is designed for healthcare use. Ensure proper compliance with local healthcare regulations (HIPAA, GDPR, etc.) before deploying in production.

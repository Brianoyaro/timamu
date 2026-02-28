# 🚀 Quick Setup Guide - Telehealth Platform

## ⚡ Fastest Way to Get Started

### Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ installed and running
- Git installed

### Step-by-Step Setup (10 minutes)

#### 1. Clone or navigate to project
```bash
cd /home/brian/telehealth
```

#### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies (2-3 minutes)
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your settings
nano .env
```

**Required .env changes:**
```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/telehealth"
JWT_SECRET=change-this-to-a-random-string-minimum-32-characters
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=ws://localhost:7880
```

```bash
# Create database
mysql -u root -p
CREATE DATABASE telehealth;
EXIT;

# Run migrations
npm run migrate

# Seed database with test accounts
npm run seed

# Start backend
npm run dev
```

Backend running at: http://localhost:5000

#### 3. Frontend Setup (New Terminal)

```bash
# Navigate to frontend
cd /home/brian/telehealth/frontend

# Install dependencies (2-3 minutes)
npm install

# Create .env file
cp .env.example .env

# Start frontend
npm run dev
```

Frontend running at: http://localhost:5173

#### 4. Setup LiveKit (Optional for Video)

**Option A: Docker (Recommended)**
```bash
cd /home/brian/telehealth/backend
docker-compose up livekit -d
```

**Option B: Download Binary**
Visit: https://github.com/livekit/livekit/releases
Download and run LiveKit server

### 🎉 You're Ready!

Open browser to: http://localhost:5173

#### Test Accounts

**Admin:**
- Email: admin@telehealth.com
- Password: admin123

**Therapist:**
- Email: therapist@example.com  
- Password: therapist123

**Patient:**
- Email: patient@example.com
- Password: patient123

---

## 🐳 Alternative: Docker Setup (5 minutes)

```bash
cd /home/brian/telehealth/backend

# Start all services
docker-compose up -d

# Wait 30 seconds for services to start

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run seed

# Check services
docker-compose ps
```

Then start frontend:
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🔍 Verify Installation

### Check Backend
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

### Check Frontend
Open: http://localhost:5173
Should see login page

### Check Database
```bash
cd backend
npm run studio
```

Opens Prisma Studio at http://localhost:5555

---

## 🎯 First Steps After Setup

1. **Login as Admin**
   - Go to http://localhost:5173
   - Login with admin credentials
   - View system metrics

2. **Approve Therapist**
   - In admin dashboard
   - Go to therapist management
   - Approve the sample therapist

3. **Test Patient Flow**
   - Logout and login as patient
   - Browse therapists
   - Book a session

4. **Test Video Session**
   - Ensure LiveKit is running
   - Join a session as patient
   - Join same session as therapist (different browser/incognito)

---

## ⚠️ Common Issues

### "Database connection failed"
- Verify MySQL is running: `sudo systemctl status mysql`
- Check DATABASE_URL in .env
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### "Port already in use"
- Backend (5000): `lsof -ti:5000 | xargs kill -9`
- Frontend (5173): `lsof -ti:5173 | xargs kill -9`

### "Prisma Client not found"
```bash
cd backend
npm run generate
```

### "LiveKit connection failed"
- Check if LiveKit is running: `docker ps | grep livekit`
- Verify LIVEKIT_URL in backend .env
- Check firewall settings

### "Cannot find module"
```bash
# Backend
cd backend && npm install

# Frontend  
cd frontend && npm install
```

---

## 📱 Development Workflow

### Starting Development

**Terminal 1 - Backend:**
```bash
cd /home/brian/telehealth/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /home/brian/telehealth/frontend
npm run dev
```

**Terminal 3 - LiveKit (if using Docker):**
```bash
cd /home/brian/telehealth/backend
docker-compose up livekit
```

### Making Changes

**Backend:**
- Edit files in `backend/src/`
- Server auto-restarts (nodemon)
- Check terminal for errors

**Frontend:**
- Edit files in `frontend/src/`
- Browser auto-refreshes (HMR)
- Check browser console for errors

**Database:**
- Edit `backend/prisma/schema.prisma`
- Run: `npm run migrate -- --name your_change`
- Prisma Client auto-updates

---

## 🔐 Security Notes for Production

Before deploying to production:

1. **Change JWT_SECRET** to a strong random string (32+ characters)
2. **Update LiveKit credentials** (not devkey/devsecret)
3. **Set NODE_ENV=production**
4. **Use strong database password**
5. **Enable HTTPS**
6. **Set proper CORS origins**
7. **Configure rate limits appropriately**
8. **Set up database backups**
9. **Enable monitoring/logging**
10. **Review security headers**

---

## 📚 Next Steps

- Read [Main README](./README.md) for full documentation
- Check [Backend README](./backend/README.md) for API details
- Check [Frontend README](./frontend/README.md) for UI development
- Explore the codebase
- Customize for your needs

---

## 💡 Tips

- Use Prisma Studio to inspect data: `npm run studio` (in backend/)
- Check API in browser: http://localhost:5000/health
- Use browser DevTools Network tab to debug API calls
- Check terminal output for backend errors
- Use React DevTools for frontend debugging

---

## 🆘 Need Help?

1. Check the README files
2. Review error messages carefully
3. Search issues in documentation
4. Check browser/terminal console
5. Verify all services are running

---

## ✅ Checklist

- [ ] Node.js 18+ installed
- [ ] MySQL installed and running
- [ ] Backend dependencies installed
- [ ] Backend .env configured
- [ ] Database created and migrated
- [ ] Backend server running (port 5000)
- [ ] Frontend dependencies installed
- [ ] Frontend server running (port 5173)
- [ ] LiveKit server running (optional, for video)
- [ ] Can login with test accounts
- [ ] Can navigate dashboards

**All checked? You're good to go! 🎉**

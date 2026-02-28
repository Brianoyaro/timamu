import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@telehealth.com' },
    update: {},
    create: {
      email: 'admin@telehealth.com',
      name: 'System Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Created admin:', admin.email);

  // Create sample therapist
  const therapistPassword = await bcrypt.hash('therapist123', 10);
  const therapist = await prisma.user.upsert({
    where: { email: 'therapist@example.com' },
    update: {},
    create: {
      email: 'therapist@example.com',
      name: 'Dr. Jane Smith',
      password: therapistPassword,
      role: 'THERAPIST',
    },
  });

  // Create therapist profile
  await prisma.therapistProfile.upsert({
    where: { userId: therapist.id },
    update: {},
    create: {
      userId: therapist.id,
      specialization: 'Clinical Psychology',
      licenseNumber: 'PSY-12345',
      bio: 'Experienced clinical psychologist specializing in cognitive behavioral therapy and trauma-informed care.',
      isApproved: true,
      availability: {
        monday: ['09:00-12:00', '14:00-17:00'],
        tuesday: ['09:00-12:00', '14:00-17:00'],
        wednesday: ['09:00-12:00', '14:00-17:00'],
        thursday: ['09:00-12:00', '14:00-17:00'],
        friday: ['09:00-12:00'],
      },
    },
  });

  console.log('Created therapist:', therapist.email);

  // Create sample patient
  const patientPassword = await bcrypt.hash('patient123', 10);
  const patient = await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: {},
    create: {
      email: 'patient@example.com',
      name: 'John Doe',
      password: patientPassword,
      role: 'PATIENT',
    },
  });

  console.log('Created patient:', patient.email);

  // Create sample bookings
  const now = new Date();
  
  // Booking 1: Scheduled for now (can join immediately)
  const scheduledBooking = await prisma.booking.create({
    data: {
      patientId: patient.id,
      therapistId: therapist.id,
      scheduledAt: new Date(now.getTime() + 5 * 60000), // 5 minutes from now
      status: 'SCHEDULED',
      notes: 'Initial consultation session',
    },
  });

  // Booking 2: Scheduled for tomorrow
  const futureBooking = await prisma.booking.create({
    data: {
      patientId: patient.id,
      therapistId: therapist.id,
      scheduledAt: new Date(now.getTime() + 24 * 60 * 60000), // Tomorrow
      status: 'SCHEDULED',
      notes: 'Follow-up session',
    },
  });

  // Booking 3: Completed booking
  const completedBooking = await prisma.booking.create({
    data: {
      patientId: patient.id,
      therapistId: therapist.id,
      scheduledAt: new Date(now.getTime() - 24 * 60 * 60000), // Yesterday
      status: 'COMPLETED',
      notes: 'Completed initial assessment',
    },
  });

  console.log('Created sample bookings:', {
    scheduled: scheduledBooking.id,
    future: futureBooking.id,
    completed: completedBooking.id,
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

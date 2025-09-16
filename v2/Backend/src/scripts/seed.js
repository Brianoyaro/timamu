/**
 * Database seeding script
 * Creates initial data for development and testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seeding...');

  try {
    // Clean existing data in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Cleaning existing data...');
      await prisma.refreshToken.deleteMany();
      await prisma.auditLog.deleteMany();
      await prisma.file.deleteMany();
      await prisma.message.deleteMany();
      await prisma.sessionNote.deleteMany();
      await prisma.session.deleteMany();
      await prisma.patientProfile.deleteMany();
      await prisma.therapistProfile.deleteMany();
      await prisma.adminProfile.deleteMany();
      await prisma.user.deleteMany();
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@telepsychology.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
        adminProfile: {
          create: {
            permissions: ['USER_MANAGEMENT', 'SYSTEM_CONFIG', 'AUDIT_LOGS', 'ANALYTICS'],
            level: 'SUPER_ADMIN'
          }
        }
      }
    });

    logger.info(`Created admin user: ${admin.email}`);

    // Create sample therapists
    const therapist1 = await prisma.user.create({
      data: {
        email: 'dr.smith@telepsychology.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Smith',
        role: 'THERAPIST',
        isActive: true,
        isVerified: true,
        phone: '+1234567890',
        gender: 'FEMALE',
        therapistProfile: {
          create: {
            licenseNumber: 'LIC001',
            specializations: ['Anxiety', 'Depression', 'PTSD'],
            experience: 8,
            education: 'PhD in Clinical Psychology, Harvard University',
            biography: 'Dr. Sarah Smith is a licensed clinical psychologist with over 8 years of experience treating anxiety, depression, and trauma-related disorders.',
            hourlyRate: 150.00,
            isApproved: true,
            approvedAt: new Date(),
            timezone: 'America/New_York',
            workingHours: {
              monday: { start: '09:00', end: '17:00' },
              tuesday: { start: '09:00', end: '17:00' },
              wednesday: { start: '09:00', end: '17:00' },
              thursday: { start: '09:00', end: '17:00' },
              friday: { start: '09:00', end: '15:00' }
            }
          }
        }
      }
    });

    const therapist2 = await prisma.user.create({
      data: {
        email: 'dr.johnson@telepsychology.com',
        password: hashedPassword,
        firstName: 'Michael',
        lastName: 'Johnson',
        role: 'THERAPIST',
        isActive: true,
        isVerified: true,
        phone: '+1234567891',
        gender: 'MALE',
        therapistProfile: {
          create: {
            licenseNumber: 'LIC002',
            specializations: ['Family Therapy', 'Couples Counseling', 'Addiction'],
            experience: 12,
            education: 'PhD in Marriage and Family Therapy, UCLA',
            biography: 'Dr. Michael Johnson specializes in family and couples therapy with a focus on addiction recovery and relationship healing.',
            hourlyRate: 175.00,
            isApproved: true,
            approvedAt: new Date(),
            timezone: 'America/Los_Angeles',
            workingHours: {
              monday: { start: '10:00', end: '18:00' },
              tuesday: { start: '10:00', end: '18:00' },
              wednesday: { start: '10:00', end: '18:00' },
              thursday: { start: '10:00', end: '18:00' },
              friday: { start: '10:00', end: '16:00' }
            }
          }
        }
      }
    });

    // Create pending therapist
    const pendingTherapist = await prisma.user.create({
      data: {
        email: 'dr.williams@telepsychology.com',
        password: hashedPassword,
        firstName: 'Emma',
        lastName: 'Williams',
        role: 'THERAPIST',
        isActive: true,
        isVerified: true,
        phone: '+1234567892',
        gender: 'FEMALE',
        therapistProfile: {
          create: {
            licenseNumber: 'LIC003',
            specializations: ['Child Psychology', 'Autism Spectrum', 'ADHD'],
            experience: 5,
            education: 'PhD in Child Psychology, Stanford University',
            biography: 'Dr. Emma Williams specializes in working with children and adolescents, particularly those on the autism spectrum.',
            hourlyRate: 140.00,
            isApproved: false, // Pending approval
            timezone: 'America/Chicago'
          }
        }
      }
    });

    logger.info(`Created therapists: ${therapist1.email}, ${therapist2.email}, ${pendingTherapist.email}`);

    // Create sample patients
    const patient1 = await prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'PATIENT',
        isActive: true,
        isVerified: true,
        phone: '+1234567893',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'MALE',
        patientProfile: {
          create: {
            medicalHistory: 'History of anxiety and mild depression. No current medications.',
            emergencyContact: 'Jane Doe (spouse) - +1234567894',
            insuranceInfo: 'Blue Cross Blue Shield - Policy #ABC123',
            preferredLanguage: 'en',
            timezone: 'America/New_York'
          }
        }
      }
    });

    const patient2 = await prisma.user.create({
      data: {
        email: 'mary.wilson@example.com',
        password: hashedPassword,
        firstName: 'Mary',
        lastName: 'Wilson',
        role: 'PATIENT',
        isActive: true,
        isVerified: true,
        phone: '+1234567895',
        dateOfBirth: new Date('1985-08-22'),
        gender: 'FEMALE',
        patientProfile: {
          create: {
            medicalHistory: 'PTSD following car accident. Currently taking sertraline.',
            emergencyContact: 'Robert Wilson (brother) - +1234567896',
            insuranceInfo: 'Aetna - Policy #XYZ789',
            preferredLanguage: 'en',
            timezone: 'America/Los_Angeles'
          }
        }
      }
    });

    logger.info(`Created patients: ${patient1.email}, ${patient2.email}`);

    // Assign therapists to patients
    const therapist1Profile = await prisma.therapistProfile.findUnique({
      where: { userId: therapist1.id }
    });

    const therapist2Profile = await prisma.therapistProfile.findUnique({
      where: { userId: therapist2.id }
    });

    await prisma.patientProfile.update({
      where: { userId: patient1.id },
      data: { assignedTherapistId: therapist1Profile.id }
    });

    await prisma.patientProfile.update({
      where: { userId: patient2.id },
      data: { assignedTherapistId: therapist2Profile.id }
    });

    logger.info('Assigned therapists to patients');

    // Create sample sessions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0); // 10 AM next week

    const session1 = await prisma.session.create({
      data: {
        patientId: patient1.id,
        therapistId: therapist1.id,
        scheduledAt: tomorrow,
        sessionType: 'VIDEO',
        status: 'SCHEDULED',
        notes: 'Initial consultation session',
        cost: 150.00
      }
    });

    const session2 = await prisma.session.create({
      data: {
        patientId: patient2.id,
        therapistId: therapist2.id,
        scheduledAt: nextWeek,
        sessionType: 'VIDEO',
        status: 'SCHEDULED',
        notes: 'Follow-up session for PTSD treatment',
        cost: 175.00
      }
    });

    // Create a completed session
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(15, 0, 0, 0);

    const completedSession = await prisma.session.create({
      data: {
        patientId: patient1.id,
        therapistId: therapist1.id,
        scheduledAt: lastWeek,
        startedAt: lastWeek,
        endedAt: new Date(lastWeek.getTime() + 50 * 60 * 1000), // 50 minutes later
        duration: 50,
        sessionType: 'VIDEO',
        status: 'COMPLETED',
        notes: 'First session - assessment and goal setting',
        cost: 150.00,
        isPaid: true
      }
    });

    logger.info(`Created sessions: ${session1.id}, ${session2.id}, ${completedSession.id}`);

    // Create session notes
    await prisma.sessionNote.create({
      data: {
        sessionId: completedSession.id,
        therapistId: therapist1Profile.id,
        content: 'Patient presented with moderate anxiety symptoms. Discussed coping strategies and established treatment goals. Recommended weekly sessions initially.',
        isPrivate: true
      }
    });

    // Create sample messages
    const message1 = await prisma.message.create({
      data: {
        senderId: patient1.id,
        receiverId: therapist1.id,
        content: 'Hi Dr. Smith, I wanted to follow up on our last session. I\'ve been practicing the breathing exercises you taught me.',
        messageType: 'TEXT',
        isEncrypted: true,
        isRead: true,
        readAt: new Date()
      }
    });

    const message2 = await prisma.message.create({
      data: {
        senderId: therapist1.id,
        receiverId: patient1.id,
        content: 'That\'s wonderful to hear, John! How are you feeling about the upcoming session tomorrow?',
        messageType: 'TEXT',
        isEncrypted: true,
        isRead: false
      }
    });

    logger.info(`Created messages: ${message1.id}, ${message2.id}`);

    // Create audit logs
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'USER_LOGIN',
          userId: admin.id,
          userEmail: admin.email,
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          userAgent: 'Seed Script'
        },
        {
          action: 'SESSION_CREATE',
          userId: patient1.id,
          userEmail: patient1.email,
          resource: 'SESSION',
          resourceId: session1.id,
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          userAgent: 'Seed Script'
        },
        {
          action: 'THERAPIST_APPROVE',
          userId: admin.id,
          userEmail: admin.email,
          resource: 'THERAPIST',
          resourceId: therapist1Profile.id,
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          userAgent: 'Seed Script'
        }
      ]
    });

    logger.info('Created audit logs');

    logger.info('Database seeding completed successfully!');
    logger.info('\n=== Created Users ===');
    logger.info(`Admin: ${admin.email} / password123`);
    logger.info(`Therapist 1: ${therapist1.email} / password123`);
    logger.info(`Therapist 2: ${therapist2.email} / password123`);
    logger.info(`Pending Therapist: ${pendingTherapist.email} / password123`);
    logger.info(`Patient 1: ${patient1.email} / password123`);
    logger.info(`Patient 2: ${patient2.email} / password123`);

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  logger.error('Seeding failed:', error);
  process.exit(1);
});

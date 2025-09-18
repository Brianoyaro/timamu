const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting lean NGO telepsychology platform seed...');

  // Clear existing data (gracefully handle missing tables)
  console.log('🧹 Cleaning up existing data...');
  const tables = [
    'auditLog', 'refreshToken', 'file', 'rating', 
    'message', 'sessionNote', 'session', 'adminProfile', 
    'therapistProfile', 'patientProfile', 'user'
  ];
  
  for (const table of tables) {
    try {
      await prisma[table].deleteMany();
      console.log(`✅ Cleared ${table} table`);
    } catch (error) {
      console.log(`⏭️ Skipping ${table} table (doesn't exist yet)`);
    }
  }

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Admin Users
  console.log('👑 Creating admin users...');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@ngotherapyplatform.org',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      phone: '+1-555-0100',
      adminProfile: {
        create: {
          permissions: ['manage_users', 'view_analytics', 'handle_reports', 'approve_therapists'],
          level: 'SUPER_ADMIN'
        }
      }
    },
    include: { adminProfile: true }
  });

  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@ngotherapyplatform.org',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Moderator',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      adminProfile: {
        create: {
          permissions: ['view_analytics', 'handle_reports'],
          level: 'MODERATOR'
        }
      }
    },
    include: { adminProfile: true }
  });

  // 2. Create Therapist Users
  console.log('🧠 Creating therapist users...');
  const therapists = await Promise.all([
    prisma.user.create({
      data: {
        email: 'dr.smith@ngotherapy.org',
        password: hashedPassword,
        firstName: 'Dr. Jennifer',
        lastName: 'Smith',
        role: 'THERAPIST',
        isActive: true,
        isVerified: true,
        phone: '+1-555-0201',
        gender: 'FEMALE',
        therapistProfile: {
          create: {
            licenseNumber: 'PSY-12345',
            specializations: ['anxiety', 'depression', 'trauma', 'family'],
            languages: ['en', 'es'],
            experience: 8,
            education: 'Ph.D. in Clinical Psychology, Stanford University',
            biography: 'Specialized in trauma-informed care and family therapy with 8+ years of experience.',
            isApproved: true,
            approvedAt: new Date(),
            availability: {
              monday: { "09:00": "17:00" },
              tuesday: { "09:00": "17:00" },
              wednesday: { "09:00": "17:00" },
              thursday: { "09:00": "17:00" },
              friday: { "09:00": "15:00" }
            },
            timezone: 'America/New_York',
            acceptsEmergency: true
          }
        }
      },
      include: { therapistProfile: true }
    }),

    prisma.user.create({
      data: {
        email: 'dr.garcia@ngotherapy.org',
        password: hashedPassword,
        firstName: 'Dr. Carlos',
        lastName: 'Garcia',
        role: 'THERAPIST',
        isActive: true,
        isVerified: true,
        phone: '+1-555-0202',
        gender: 'MALE',
        therapistProfile: {
          create: {
            licenseNumber: 'PSY-67890',
            specializations: ['addiction', 'anxiety', 'behavioral'],
            languages: ['en', 'es', 'fr'],
            experience: 12,
            education: 'Psy.D. in Clinical Psychology, University of California',
            biography: 'Bilingual therapist specializing in addiction recovery and behavioral interventions.',
            isApproved: true,
            approvedAt: new Date(),
            availability: {
              monday: { "10:00": "18:00" },
              tuesday: { "10:00": "18:00" },
              wednesday: { "10:00": "18:00" },
              thursday: { "10:00": "18:00" },
              saturday: { "09:00": "13:00" }
            },
            timezone: 'America/Los_Angeles',
            acceptsEmergency: false
          }
        }
      },
      include: { therapistProfile: true }
    }),

    prisma.user.create({
      data: {
        email: 'dr.johnson@ngotherapy.org',
        password: hashedPassword,
        firstName: 'Dr. Amanda',
        lastName: 'Johnson',
        role: 'THERAPIST',
        isActive: true,
        isVerified: true,
        phone: '+1-555-0203',
        gender: 'FEMALE',
        therapistProfile: {
          create: {
            licenseNumber: 'PSY-11111',
            specializations: ['adolescent', 'family', 'anxiety'],
            languages: ['en'],
            experience: 6,
            education: 'M.A. in Marriage and Family Therapy, Northwestern University',
            biography: 'Specializes in adolescent therapy and family counseling with a focus on communication.',
            isApproved: true,
            approvedAt: new Date(),
            availability: {
              tuesday: { "08:00": "16:00" },
              wednesday: { "08:00": "16:00" },
              thursday: { "08:00": "16:00" },
              friday: { "08:00": "16:00" },
              saturday: { "10:00": "14:00" }
            },
            timezone: 'America/Chicago',
            acceptsEmergency: true
          }
        }
      },
      include: { therapistProfile: true }
    }),

    // Pending therapist (not yet approved)
    prisma.user.create({
      data: {
        email: 'dr.pending@ngotherapy.org',
        password: hashedPassword,
        firstName: 'Dr. Maria',
        lastName: 'Rodriguez',
        role: 'THERAPIST',
        isActive: true,
        isVerified: true,
        phone: '+1-555-0204',
        gender: 'FEMALE',
        therapistProfile: {
          create: {
            licenseNumber: 'PSY-22222',
            specializations: ['trauma', 'ptsd', 'veterans'],
            languages: ['en', 'es'],
            experience: 10,
            education: 'Ph.D. in Clinical Psychology, Yale University',
            biography: 'Veteran therapist specializing in PTSD and trauma recovery.',
            isApproved: false, // Not yet approved
            availability: {
              monday: { "09:00": "17:00" },
              wednesday: { "09:00": "17:00" },
              friday: { "09:00": "17:00" }
            },
            timezone: 'America/New_York',
            acceptsEmergency: true
          }
        }
      },
      include: { therapistProfile: true }
    })
  ]);

  // 3. Create Patient Users
  console.log('🤝 Creating patient users...');
  const patients = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@email.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'PATIENT',
        isActive: true,
        isVerified: true,
        phone: '+1-555-0301',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'MALE',
        patientProfile: {
          create: {
            medicalHistory: 'No major medical conditions. Previous experience with anxiety management.',
            emergencyContact: 'Jane Doe (spouse) - +1-555-0302',
            preferredLanguage: 'en',
            timezone: 'America/New_York'
          }
        }
      },
      include: { patientProfile: true }
    }),

    prisma.user.create({
      data: {
        email: 'maria.gonzalez@email.com',
        password: hashedPassword,
        firstName: 'Maria',
        lastName: 'Gonzalez',
        role: 'PATIENT',
        isActive: true,
        isVerified: true,
        phone: '+1-555-0303',
        dateOfBirth: new Date('1985-08-22'),
        gender: 'FEMALE',
        patientProfile: {
          create: {
            medicalHistory: 'History of depression, currently stable.',
            emergencyContact: 'Carlos Gonzalez (brother) - +1-555-0304',
            preferredLanguage: 'es',
            timezone: 'America/Los_Angeles'
          }
        }
      },
      include: { patientProfile: true }
    }),

    prisma.user.create({
      data: {
        email: 'alex.wilson@email.com',
        password: hashedPassword,
        firstName: 'Alex',
        lastName: 'Wilson',
        role: 'PATIENT',
        isActive: true,
        isVerified: true,
        phone: '+1-555-0305',
        dateOfBirth: new Date('1995-12-03'),
        gender: 'OTHER',
        patientProfile: {
          create: {
            medicalHistory: 'Anxiety and stress management needs.',
            emergencyContact: 'Sam Wilson (parent) - +1-555-0306',
            preferredLanguage: 'en',
            timezone: 'America/Chicago'
          }
        }
      },
      include: { patientProfile: true }
    })
  ]);

  // 4. Create Sessions
  console.log('📅 Creating therapy sessions...');
  const now = new Date();
  const sessions = [];

  // Completed session with rating
  const completedSession = await prisma.session.create({
    data: {
      patientId: patients[0].id,
      therapistId: therapists[0].id,
      scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      startedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
      duration: 50,
      status: 'COMPLETED',
      sessionType: 'VIDEO',
      title: 'Initial Consultation',
      notes: 'Looking forward to discussing anxiety management strategies.',
      isEmergency: false
    }
  });
  sessions.push(completedSession);

  // Upcoming session
  const upcomingSession = await prisma.session.create({
    data: {
      patientId: patients[1].id,
      therapistId: therapists[1].id,
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: 'SCHEDULED',
      sessionType: 'VIDEO',
      title: 'Follow-up Session',
      notes: 'Continue working on depression management techniques.',
      isEmergency: false
    }
  });
  sessions.push(upcomingSession);

  // Emergency session
  const emergencySession = await prisma.session.create({
    data: {
      patientId: patients[2].id,
      therapistId: therapists[0].id, // Dr. Smith accepts emergency
      scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      status: 'SCHEDULED',
      sessionType: 'VIDEO',
      title: 'Emergency Session',
      notes: 'Urgent anxiety episode, need immediate support.',
      isEmergency: true,
      emergencyNotes: 'Patient experiencing panic attacks, needs immediate intervention.'
    }
  });
  sessions.push(emergencySession);

  // 5. Create Session Notes (for completed session)
  console.log('📝 Creating session notes...');
  await prisma.sessionNote.create({
    data: {
      sessionId: completedSession.id,
      therapistId: therapists[0].therapistProfile.id,
      content: `Initial session with John Doe. Patient presented with mild anxiety symptoms related to work stress. 
      
Key observations:
- Good rapport established
- Patient is motivated for treatment
- Discussed coping strategies
- Recommended mindfulness exercises
      
Next steps:
- Continue weekly sessions
- Practice breathing exercises
- Monitor anxiety levels`,
      isSharedWithPatient: false
    }
  });

  // 6. Create Rating for completed session
  console.log('⭐ Creating session rating...');
  await prisma.rating.create({
    data: {
      sessionId: completedSession.id,
      giverId: patients[0].id,
      receiverId: therapists[0].id,
      rating: 5,
      review: 'Dr. Smith was incredibly helpful and understanding. I felt comfortable sharing my concerns and learned valuable coping strategies.',
      isAnonymous: false
    }
  });

  // 7. Create Messages
  console.log('💬 Creating messages...');
  await Promise.all([
    prisma.message.create({
      data: {
        senderId: patients[0].id,
        receiverId: therapists[0].id,
        content: 'Hi Dr. Smith, thank you for the session today. The breathing exercises are really helping.',
        messageType: 'TEXT',
        sessionId: completedSession.id,
        isRead: true,
        readAt: new Date()
      }
    }),

    prisma.message.create({
      data: {
        senderId: therapists[0].id,
        receiverId: patients[0].id,
        content: 'I\'m so glad to hear that, John! Keep practicing those techniques and let me know how you\'re feeling before our next session.',
        messageType: 'TEXT',
        sessionId: completedSession.id,
        isRead: false
      }
    }),

    prisma.message.create({
      data: {
        senderId: patients[1].id,
        receiverId: therapists[1].id,
        content: 'Looking forward to our session tomorrow. I\'ve been working on the journal exercises you suggested.',
        messageType: 'TEXT',
        sessionId: upcomingSession.id,
        isRead: false
      }
    })
  ]);

  // 8. Create Files/Resources
  console.log('📄 Creating therapy resources...');
  await Promise.all([
    prisma.file.create({
      data: {
        originalName: 'anxiety-management-guide.pdf',
        fileName: 'anxiety-guide-' + Date.now() + '.pdf',
        filePath: '/uploads/resources/anxiety-guide.pdf',
        mimeType: 'application/pdf',
        size: 245760,
        uploaderId: therapists[0].id,
        sessionId: completedSession.id,
        description: 'Comprehensive guide to anxiety management techniques',
        category: 'RESOURCE',
        isPublic: false
      }
    }),

    prisma.file.create({
      data: {
        originalName: 'mindfulness-exercises.pdf',
        fileName: 'mindfulness-' + Date.now() + '.pdf',
        filePath: '/uploads/resources/mindfulness.pdf',
        mimeType: 'application/pdf',
        size: 189320,
        uploaderId: therapists[0].id,
        description: 'Daily mindfulness and meditation exercises',
        category: 'HOMEWORK',
        isPublic: true
      }
    })
  ]);

  // 9. Create Audit Logs
  console.log('📊 Creating audit logs...');
  await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: patients[0].id,
        userEmail: patients[0].email,
        action: 'LOGIN',
        resource: 'AUTH',
        status: 'SUCCESS',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }),

    prisma.auditLog.create({
      data: {
        userId: patients[0].id,
        userEmail: patients[0].email,
        action: 'BOOK_SESSION',
        resource: 'SESSION',
        resourceId: completedSession.id,
        status: 'SUCCESS',
        ipAddress: '192.168.1.100',
        details: { therapistId: therapists[0].id, sessionType: 'VIDEO' }
      }
    }),

    prisma.auditLog.create({
      data: {
        userId: superAdmin.id,
        userEmail: superAdmin.email,
        action: 'APPROVE_THERAPIST',
        resource: 'THERAPIST',
        resourceId: therapists[0].id,
        status: 'SUCCESS',
        ipAddress: '10.0.0.1',
        details: { licenseNumber: 'PSY-12345' }
      }
    })
  ]);

  console.log('✅ Lean NGO telepsychology platform seed completed successfully!');
  console.log('\n📋 Seed Summary:');
  console.log(`- ${await prisma.user.count()} users created`);
  console.log(`- ${await prisma.therapistProfile.count()} therapist profiles`);
  console.log(`- ${await prisma.patientProfile.count()} patient profiles`);
  console.log(`- ${await prisma.adminProfile.count()} admin profiles`);
  console.log(`- ${await prisma.session.count()} sessions`);
  console.log(`- ${await prisma.message.count()} messages`);
  console.log(`- ${await prisma.file.count()} files`);
  console.log(`- ${await prisma.rating.count()} ratings`);
  console.log(`- ${await prisma.auditLog.count()} audit logs`);

  console.log('\n🔑 Test Login Credentials:');
  console.log('Admin: admin@ngotherapyplatform.org / password123');
  console.log('Therapist: dr.smith@ngotherapy.org / password123');
  console.log('Patient: john.doe@email.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

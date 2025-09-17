/**
 * Comprehensive Database Seeding Script
 * Creates complete initial data for development and testing including:
 * - Therapy specializations and assignment types
 * - Users (admin, therapists, patients) 
 * - Sample assignments using the new system
 * - Sessions, messages, and audit logs
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Therapy Specializations Data
const specializationsData = [
  {
    code: 'GEN001',
    name: 'General Therapy',
    category: 'general',
    description: 'General mental health counseling and support',
    requiresSpecialCert: false,
    emergencyAccess: false,
    maxConcurrentPatients: 20
  },
  {
    code: 'FAM001',
    name: 'Family Therapy',
    category: 'specialized',
    description: 'Family systems therapy and relationship counseling',
    requiresSpecialCert: true,
    emergencyAccess: false,
    maxConcurrentPatients: 15
  },
  {
    code: 'ADD001', 
    name: 'Addiction Therapy',
    category: 'specialized',
    description: 'Substance abuse and addiction recovery therapy',
    requiresSpecialCert: true,
    emergencyAccess: false,
    maxConcurrentPatients: 12
  },
  {
    code: 'TRA001',
    name: 'Trauma Therapy',
    category: 'specialized', 
    description: 'PTSD and trauma-informed therapeutic approaches',
    requiresSpecialCert: true,
    emergencyAccess: false,
    maxConcurrentPatients: 10
  },
  {
    code: 'CHI001',
    name: 'Child Psychology',
    category: 'specialized',
    description: 'Child and adolescent mental health therapy',
    requiresSpecialCert: true,
    emergencyAccess: false,
    maxConcurrentPatients: 15
  },
  {
    code: 'SUI001',
    name: 'Suicide Prevention',
    category: 'emergency',
    description: 'Crisis intervention and suicide prevention therapy',
    requiresSpecialCert: true,
    emergencyAccess: true,
    maxConcurrentPatients: 8
  },
  {
    code: 'CRI001',
    name: 'Crisis Intervention',
    category: 'emergency',
    description: 'Immediate psychological crisis support',
    requiresSpecialCert: true,
    emergencyAccess: true,
    maxConcurrentPatients: 6
  },
  {
    code: 'EAT001',
    name: 'Eating Disorders',
    category: 'specialized',
    description: 'Anorexia, bulimia, and eating disorder therapy',
    requiresSpecialCert: true,
    emergencyAccess: false,
    maxConcurrentPatients: 10
  },
  {
    code: 'ANX001',
    name: 'Anxiety Disorders',
    category: 'specialized',
    description: 'Anxiety, panic disorders, and phobia therapy',
    requiresSpecialCert: false,
    emergencyAccess: false,
    maxConcurrentPatients: 18
  }
];

// Assignment Types Data
const assignmentTypesData = [
  {
    code: 'primary',
    name: 'Primary Care',
    description: 'Long-term primary mental health care relationship',
    priority: 1,
    allowsConcurrent: false,
    requiresApproval: false,
    defaultMaxSessions: null,
    defaultDurationDays: null
  },
  {
    code: 'specialist',
    name: 'Specialist Care', 
    description: 'Specialized therapy for specific conditions',
    priority: 2,
    allowsConcurrent: true,
    requiresApproval: true,
    defaultMaxSessions: 12,
    defaultDurationDays: 90
  },
  {
    code: 'emergency',
    name: 'Emergency Care',
    description: 'Immediate crisis intervention and emergency support',
    priority: 10,
    allowsConcurrent: true,
    requiresApproval: false,
    defaultMaxSessions: 6,
    defaultDurationDays: 30
  },
  {
    code: 'consultation',
    name: 'Consultation',
    description: 'Short-term consultation or second opinion',
    priority: 3,
    allowsConcurrent: true,
    requiresApproval: true,
    defaultMaxSessions: 3,
    defaultDurationDays: 14
  },
  {
    code: 'group',
    name: 'Group Therapy',
    description: 'Group therapy sessions and support groups',
    priority: 2,
    allowsConcurrent: true,
    requiresApproval: false,
    defaultMaxSessions: 24,
    defaultDurationDays: 180
  }
];

async function cleanDatabase() {
  if (process.env.NODE_ENV === 'development') {
    logger.info('🧹 Cleaning existing data...');
    
    // Delete in correct order to respect foreign key constraints
    await prisma.refreshToken.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.file.deleteMany();
    await prisma.message.deleteMany();
    await prisma.sessionNote.deleteMany();
    await prisma.session.deleteMany();
    await prisma.patientTherapistAssignment.deleteMany();
    await prisma.therapistSpecializationCapability.deleteMany();
    await prisma.patientProfile.deleteMany();
    await prisma.therapistProfile.deleteMany();
    await prisma.adminProfile.deleteMany();
    await prisma.assignmentType.deleteMany();
    await prisma.therapySpecialization.deleteMany();
    await prisma.user.deleteMany();
    
    logger.info('✅ Database cleaned');
  }
}

async function seedSpecializations() {
  logger.info('📋 Seeding therapy specializations...');
  
  const createdSpecializations = [];
  for (const spec of specializationsData) {
    const specialization = await prisma.therapySpecialization.upsert({
      where: { code: spec.code },
      update: spec,
      create: spec
    });
    createdSpecializations.push(specialization);
    logger.info(`✅ Created specialization: ${spec.name}`);
  }
  
  return createdSpecializations;
}

async function seedAssignmentTypes() {
  logger.info('🔗 Seeding assignment types...');
  
  const createdTypes = [];
  for (const type of assignmentTypesData) {
    const assignmentType = await prisma.assignmentType.upsert({
      where: { code: type.code },
      update: type,
      create: type
    });
    createdTypes.push(assignmentType);
    logger.info(`✅ Created assignment type: ${type.name}`);
  }
  
  return createdTypes;
}

async function seedUsers() {
  logger.info('👥 Seeding users...');
  
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
  logger.info(`✅ Created admin: ${admin.email}`);

  // Get specializations for therapist assignment
  const generalTherapy = await prisma.therapySpecialization.findUnique({ where: { code: 'GEN001' } });
  const anxietySpec = await prisma.therapySpecialization.findUnique({ where: { code: 'ANX001' } });
  const traumaSpec = await prisma.therapySpecialization.findUnique({ where: { code: 'TRA001' } });
  const familySpec = await prisma.therapySpecialization.findUnique({ where: { code: 'FAM001' } });
  const addictionSpec = await prisma.therapySpecialization.findUnique({ where: { code: 'ADD001' } });
  const childSpec = await prisma.therapySpecialization.findUnique({ where: { code: 'CHI001' } });
  const suicideSpec = await prisma.therapySpecialization.findUnique({ where: { code: 'SUI001' } });
  const crisisSpec = await prisma.therapySpecialization.findUnique({ where: { code: 'CRI001' } });

  // Create therapists with specializations
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
          },
          capabilities: {
            create: [
              { 
                specializationId: generalTherapy.id,
                certificationLevel: 'certified',
                yearsExperience: 8,
                isActive: true
              },
              { 
                specializationId: anxietySpec.id,
                certificationLevel: 'expert',
                yearsExperience: 8,
                isActive: true
              },
              { 
                specializationId: traumaSpec.id,
                certificationLevel: 'certified',
                yearsExperience: 5,
                isActive: true
              }
            ]
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
          },
          capabilities: {
            create: [
              { 
                specializationId: familySpec.id,
                certificationLevel: 'expert',
                yearsExperience: 12,
                isActive: true
              },
              { 
                specializationId: addictionSpec.id,
                certificationLevel: 'expert',
                yearsExperience: 10,
                isActive: true
              },
              { 
                specializationId: generalTherapy.id,
                certificationLevel: 'certified',
                yearsExperience: 12,
                isActive: true
              }
            ]
          }
        }
      }
    }
  });

  // Create crisis specialist therapist
  const therapist3 = await prisma.user.create({
    data: {
      email: 'dr.garcia@telepsychology.com',
      password: hashedPassword,
      firstName: 'Maria',
      lastName: 'Garcia',
      role: 'THERAPIST',
      isActive: true,
      isVerified: true,
      phone: '+1234567897',
      gender: 'FEMALE',
      therapistProfile: {
        create: {
          licenseNumber: 'LIC004',
          experience: 10,
          education: 'PhD in Crisis Psychology, Johns Hopkins University',
          biography: 'Dr. Maria Garcia specializes in crisis intervention and suicide prevention with extensive experience in emergency mental health care.',
          hourlyRate: 200.00,
          isApproved: true,
          approvedAt: new Date(),
          timezone: 'America/New_York',
          workingHours: {
            monday: { start: '08:00', end: '20:00' },
            tuesday: { start: '08:00', end: '20:00' },
            wednesday: { start: '08:00', end: '20:00' },
            thursday: { start: '08:00', end: '20:00' },
            friday: { start: '08:00', end: '20:00' },
            saturday: { start: '10:00', end: '18:00' },
            sunday: { start: '10:00', end: '18:00' }
          },
          capabilities: {
            create: [
              { 
                specializationId: suicideSpec.id,
                certificationLevel: 'expert',
                yearsExperience: 10,
                isActive: true
              },
              { 
                specializationId: crisisSpec.id,
                certificationLevel: 'expert',
                yearsExperience: 10,
                isActive: true
              },
              { 
                specializationId: traumaSpec.id,
                certificationLevel: 'expert',
                yearsExperience: 8,
                isActive: true
              }
            ]
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
          experience: 5,
          education: 'PhD in Child Psychology, Stanford University',
          biography: 'Dr. Emma Williams specializes in working with children and adolescents, particularly those on the autism spectrum.',
          hourlyRate: 140.00,
          isApproved: false,
          timezone: 'America/Chicago',
          capabilities: {
            create: [
              { 
                specializationId: childSpec.id,
                certificationLevel: 'certified',
                yearsExperience: 5,
                isActive: true
              }
            ]
          }
        }
      }
    }
  });

  logger.info(`✅ Created therapists: ${therapist1.email}, ${therapist2.email}, ${therapist3.email}, ${pendingTherapist.email}`);

  // Create patients
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

  const patient3 = await prisma.user.create({
    data: {
      email: 'alice.brown@example.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Brown',
      role: 'PATIENT',
      isActive: true,
      isVerified: true,
      phone: '+1234567898',
      dateOfBirth: new Date('1992-03-10'),
      gender: 'FEMALE',
      patientProfile: {
        create: {
          medicalHistory: 'Panic disorder and social anxiety. Family history of depression.',
          emergencyContact: 'Tom Brown (father) - +1234567899',
          insuranceInfo: 'United Healthcare - Policy #DEF456',
          preferredLanguage: 'en',
          timezone: 'America/Chicago'
        }
      }
    }
  });

  logger.info(`✅ Created patients: ${patient1.email}, ${patient2.email}, ${patient3.email}`);

  return {
    admin,
    therapists: [therapist1, therapist2, therapist3, pendingTherapist],
    patients: [patient1, patient2, patient3]
  };
}

async function seedAssignments(users) {
  logger.info('🔗 Creating therapist assignments...');

  const { patients, therapists } = users;
  
  // Get assignment types and specializations
  const primaryType = await prisma.assignmentType.findUnique({ where: { code: 'primary' } });
  const specialistType = await prisma.assignmentType.findUnique({ where: { code: 'specialist' } });
  const emergencyType = await prisma.assignmentType.findUnique({ where: { code: 'emergency' } });
  
  const generalSpec = await prisma.therapySpecialization.findUnique({ where: { code: 'GEN001' } });
  const anxietySpec = await prisma.therapySpecialization.findUnique({ where: { code: 'ANX001' } });
  const traumaSpec = await prisma.therapySpecialization.findUnique({ where: { code: 'TRA001' } });
  const familySpec = await prisma.therapySpecialization.findUnique({ where: { code: 'FAM001' } });
  const suicideSpec = await prisma.therapySpecialization.findUnique({ where: { code: 'SUI001' } });

  // Get therapist and patient profiles
  const therapist1Profile = await prisma.therapistProfile.findUnique({ where: { userId: therapists[0].id } });
  const therapist2Profile = await prisma.therapistProfile.findUnique({ where: { userId: therapists[1].id } });
  const therapist3Profile = await prisma.therapistProfile.findUnique({ where: { userId: therapists[2].id } });
  
  const patient1Profile = await prisma.patientProfile.findUnique({ where: { userId: patients[0].id } });
  const patient2Profile = await prisma.patientProfile.findUnique({ where: { userId: patients[1].id } });
  const patient3Profile = await prisma.patientProfile.findUnique({ where: { userId: patients[2].id } });

  // Create assignments
  // Patient 1 (John): Primary care with Dr. Smith for anxiety
  const assignment1 = await prisma.patientTherapistAssignment.create({
    data: {
      patientId: patient1Profile.id,
      therapistId: therapist1Profile.id,
      specializationId: anxietySpec.id,
      assignmentTypeId: primaryType.id,
      status: 'ACTIVE',
      reason: 'Primary care for anxiety management',
      requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      approvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      approvedBy: users.admin.id
    }
  });

  // Patient 2 (Mary): Primary care with Dr. Johnson for family therapy + trauma specialist with Dr. Smith
  const assignment2 = await prisma.patientTherapistAssignment.create({
    data: {
      patientId: patient2Profile.id,
      therapistId: therapist2Profile.id,
      specializationId: familySpec.id,
      assignmentTypeId: primaryType.id,
      status: 'ACTIVE',
      reason: 'Family therapy for relationship issues following trauma',
      requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      approvedBy: users.admin.id
    }
  });

  const assignment3 = await prisma.patientTherapistAssignment.create({
    data: {
      patientId: patient2Profile.id,
      therapistId: therapist1Profile.id,
      specializationId: traumaSpec.id,
      assignmentTypeId: specialistType.id,
      status: 'ACTIVE',
      reason: 'Specialized trauma therapy for PTSD following car accident',
      maxSessions: 12,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      approvedBy: users.admin.id
    }
  });

  // Patient 3 (Alice): Pending specialist assignment and emergency access
  const assignment4 = await prisma.patientTherapistAssignment.create({
    data: {
      patientId: patient3Profile.id,
      therapistId: therapist1Profile.id,
      specializationId: anxietySpec.id,
      assignmentTypeId: specialistType.id,
      status: 'PENDING_APPROVAL',
      reason: 'Specialist care needed for severe social anxiety and panic disorder',
      maxSessions: 12,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });

  // Emergency assignment for Alice with crisis specialist
  const assignment5 = await prisma.patientTherapistAssignment.create({
    data: {
      patientId: patient3Profile.id,
      therapistId: therapist3Profile.id,
      specializationId: suicideSpec.id,
      assignmentTypeId: emergencyType.id,
      status: 'ACTIVE',
      reason: 'Emergency access needed for suicide ideation concerns',
      maxSessions: 6,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      approvedBy: users.admin.id
    }
  });

  logger.info(`✅ Created ${5} therapist assignments`);
  
  return [assignment1, assignment2, assignment3, assignment4, assignment5];
}

async function seedSessions(users, assignments) {
  logger.info('📅 Creating sample sessions...');

  const { patients, therapists } = users;

  // Future sessions
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 0, 0, 0);

  // Create sessions based on assignments
  const session1 = await prisma.session.create({
    data: {
      patientId: patients[0].id,
      therapistId: therapists[0].id,
      assignmentId: assignments[0].id,
      scheduledAt: tomorrow,
      sessionType: 'VIDEO',
      status: 'SCHEDULED',
      notes: 'Follow-up session for anxiety management techniques',
      cost: 150.00
    }
  });

  const session2 = await prisma.session.create({
    data: {
      patientId: patients[1].id,
      therapistId: therapists[1].id,
      assignmentId: assignments[1].id,
      scheduledAt: nextWeek,
      sessionType: 'VIDEO',
      status: 'SCHEDULED',
      notes: 'Family therapy session focusing on communication skills',
      cost: 175.00
    }
  });

  // Completed session
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(15, 0, 0, 0);

  const completedSession = await prisma.session.create({
    data: {
      patientId: patients[0].id,
      therapistId: therapists[0].id,
      assignmentId: assignments[0].id,
      scheduledAt: lastWeek,
      startedAt: lastWeek,
      endedAt: new Date(lastWeek.getTime() + 50 * 60 * 1000),
      duration: 50,
      sessionType: 'VIDEO',
      status: 'COMPLETED',
      notes: 'Initial assessment and treatment planning for anxiety',
      cost: 150.00,
      isPaid: true
    }
  });

  // Emergency session
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(20, 0, 0, 0);

  const emergencySession = await prisma.session.create({
    data: {
      patientId: patients[2].id,
      therapistId: therapists[2].id,
      assignmentId: assignments[4].id,
      scheduledAt: yesterday,
      startedAt: yesterday,
      endedAt: new Date(yesterday.getTime() + 60 * 60 * 1000),
      duration: 60,
      sessionType: 'PHONE',
      status: 'COMPLETED',
      notes: 'Emergency crisis intervention session - immediate safety planning',
      cost: 200.00,
      isPaid: true
    }
  });

  logger.info(`✅ Created ${4} sessions`);

  return [session1, session2, completedSession, emergencySession];
}

async function seedSessionNotes(sessions, therapists) {
  logger.info('📝 Creating session notes...');

  const therapist1Profile = await prisma.therapistProfile.findUnique({ where: { userId: therapists[0].id } });
  const therapist2Profile = await prisma.therapistProfile.findUnique({ where: { userId: therapists[1].id } });
  const therapist3Profile = await prisma.therapistProfile.findUnique({ where: { userId: therapists[2].id } });

  // Notes for completed sessions
  await prisma.sessionNote.create({
    data: {
      sessionId: sessions[2].id, // completedSession
      therapistId: therapist1Profile.id,
      content: 'Patient presented with moderate anxiety symptoms. Discussed coping strategies including deep breathing and cognitive restructuring. Established treatment goals focused on managing panic attacks and improving social functioning. Recommended weekly sessions initially.',
      isPrivate: true
    }
  });

  await prisma.sessionNote.create({
    data: {
      sessionId: sessions[3].id, // emergencySession
      therapistId: therapist3Profile.id,
      content: 'Emergency session due to acute suicidal ideation. Conducted thorough risk assessment - patient denies immediate intent or plan. Established safety plan including crisis contacts and coping strategies. Scheduled follow-up in 48 hours. Patient agrees to remove means and contact crisis line if ideation increases.',
      isPrivate: true
    }
  });

  logger.info('✅ Created session notes');
}

async function seedMessages(users) {
  logger.info('💬 Creating sample messages...');

  const { patients, therapists } = users;

  const messages = await prisma.message.createMany({
    data: [
      {
        senderId: patients[0].id,
        receiverId: therapists[0].id,
        content: 'Hi Dr. Smith, I wanted to follow up on our last session. I\'ve been practicing the breathing exercises you taught me and they\'re really helping with my anxiety.',
        messageType: 'TEXT',
        isEncrypted: true,
        isRead: true,
        readAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        senderId: therapists[0].id,
        receiverId: patients[0].id,
        content: 'That\'s wonderful to hear, John! I\'m so glad the techniques are working for you. How are you feeling about our upcoming session tomorrow? Any specific topics you\'d like to focus on?',
        messageType: 'TEXT',
        isEncrypted: true,
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        senderId: patients[2].id,
        receiverId: therapists[2].id,
        content: 'Dr. Garcia, thank you for being available yesterday evening. The safety plan we created really helped me get through the night. I\'m feeling more stable today.',
        messageType: 'TEXT',
        isEncrypted: true,
        isRead: true,
        readAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        senderId: therapists[2].id,
        receiverId: patients[2].id,
        content: 'I\'m so relieved to hear that, Alice. You showed tremendous courage in reaching out when you needed help. Remember, I\'m here for you and we have our follow-up session scheduled for tomorrow. Keep using those coping strategies we discussed.',
        messageType: 'TEXT',
        isEncrypted: true,
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000)
      }
    ]
  });

  logger.info(`✅ Created ${messages.count} messages`);
}

async function seedAuditLogs(users, assignments, sessions) {
  logger.info('📋 Creating audit logs...');

  const { admin, patients, therapists } = users;

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'USER_LOGIN',
        userId: admin.id,
        userEmail: admin.email,
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        userAgent: 'Comprehensive Seed Script'
      },
      {
        action: 'ASSIGNMENT_APPROVED',
        userId: admin.id,
        userEmail: admin.email,
        resource: 'ASSIGNMENT',
        resourceId: assignments[0].id,
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        userAgent: 'Comprehensive Seed Script',
        details: { patientId: patients[0].id, therapistId: therapists[0].id, specialization: 'Anxiety Disorders' }
      },
      {
        action: 'SESSION_CREATE',
        userId: patients[0].id,
        userEmail: patients[0].email,
        resource: 'SESSION',
        resourceId: sessions[0].id,
        status: 'SUCCESS',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        action: 'THERAPIST_ASSIGNMENT_REQUEST',
        userId: patients[2].id,
        userEmail: patients[2].email,
        resource: 'ASSIGNMENT',
        resourceId: assignments[3].id,
        status: 'SUCCESS',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        details: { therapistId: therapists[0].id, specializationCode: 'ANX001', assignmentTypeCode: 'specialist' }
      },
      {
        action: 'EMERGENCY_ACCESS',
        userId: patients[2].id,
        userEmail: patients[2].email,
        resource: 'ASSIGNMENT',
        resourceId: assignments[4].id,
        status: 'SUCCESS',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        details: { therapistId: therapists[2].id, specializationCode: 'SUI001', emergencyAccess: true }
      }
    ]
  });

  logger.info('✅ Created audit logs');
}

async function main() {
  try {
    logger.info('🚀 Starting comprehensive database seeding...');
    
    // Clean database
    await cleanDatabase();
    
    // Seed core data
    await seedSpecializations();
    await seedAssignmentTypes();
    
    // Seed users
    const users = await seedUsers();
    
    // Seed assignments
    const assignments = await seedAssignments(users);
    
    // Seed sessions
    const sessions = await seedSessions(users, assignments);
    
    // Seed session notes
    await seedSessionNotes(sessions, users.therapists);
    
    // Seed messages
    await seedMessages(users);
    
    // Seed audit logs
    await seedAuditLogs(users, assignments, sessions);
    
    // Summary
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.therapySpecialization.count(),
      prisma.assignmentType.count(),
      prisma.patientTherapistAssignment.count(),
      prisma.session.count(),
      prisma.message.count()
    ]);

    logger.info('🎉 Comprehensive seeding completed successfully!');
    logger.info('\n📊 Database Summary:');
    logger.info(`   👥 Users: ${counts[0]}`);
    logger.info(`   🧠 Specializations: ${counts[1]}`);
    logger.info(`   🔗 Assignment Types: ${counts[2]}`);
    logger.info(`   📋 Patient Assignments: ${counts[3]}`);
    logger.info(`   📅 Sessions: ${counts[4]}`);
    logger.info(`   💬 Messages: ${counts[5]}`);
    
    logger.info('\n=== Login Credentials ===');
    logger.info('Admin: admin@telepsychology.com / password123');
    logger.info('Therapist 1: dr.smith@telepsychology.com / password123');
    logger.info('Therapist 2: dr.johnson@telepsychology.com / password123');
    logger.info('Crisis Specialist: dr.garcia@telepsychology.com / password123');
    logger.info('Pending Therapist: dr.williams@telepsychology.com / password123');
    logger.info('Patient 1: john.doe@example.com / password123');
    logger.info('Patient 2: mary.wilson@example.com / password123');
    logger.info('Patient 3: alice.brown@example.com / password123');
    
    logger.info('\n🔍 Notable Features Seeded:');
    logger.info('• Multi-therapist assignments (Mary has family + trauma specialists)');
    logger.info('• Emergency access assignment (Alice has crisis intervention)');
    logger.info('• Pending approval workflow (Alice\'s anxiety specialist request)');
    logger.info('• Different session types and statuses');
    logger.info('• Professional specialization system with 9 therapy types');
    logger.info('• 5 assignment types supporting real-world healthcare workflows');

  } catch (error) {
    logger.error('❌ Comprehensive seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { main };

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/password.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default tenant
  const defaultTenant = await prisma.tenant.upsert({
    where: { domain: 'default.mindlink.com' },
    update: {},
    create: {
      name: 'Default Clinic',
      domain: 'default.mindlink.com',
      status: 'active',
      plan: 'professional',
      settings: {
        primaryColor: '#3b82f6',
        allowRegistration: true,
        requireEmailVerification: false
      }
    }
  })

  console.log('✅ Created default tenant:', defaultTenant.name)

  // Create demo clinic tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { domain: 'demo.mindlink.com' },
    update: {},
    create: {
      name: 'Demo Wellness Center',
      domain: 'demo.mindlink.com',
      status: 'active',
      plan: 'basic',
      settings: {
        primaryColor: '#10b981',
        allowRegistration: true,
        requireEmailVerification: false
      }
    }
  })

  console.log('✅ Created demo tenant:', demoTenant.name)

  // Create admin user
  const adminPassword = await hashPassword('admin123!')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mindlink.com' },
    update: {},
    create: {
      email: 'admin@mindlink.com',
      password: adminPassword,
      name: 'System Administrator',
      roles: ['admin'],
      status: 'active',
      emailVerified: true,
      tenantId: defaultTenant.id
    }
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create demo therapist
  const therapistPassword = await hashPassword('therapist123!')
  const therapistUser = await prisma.user.upsert({
    where: { email: 'sarah.johnson@mindlink.com' },
    update: {},
    create: {
      email: 'sarah.johnson@mindlink.com',
      password: therapistPassword,
      name: 'Dr. Sarah Johnson',
      roles: ['therapist'],
      status: 'active',
      emailVerified: true,
      tenantId: defaultTenant.id,
      title: 'Licensed Clinical Social Worker',
      bio: 'Dr. Johnson is a licensed clinical social worker with over 10 years of experience in mental health treatment. She specializes in evidence-based therapies for anxiety, depression, and trauma.',
      specializations: ['Anxiety', 'Depression', 'PTSD', 'Cognitive Behavioral Therapy'],
      languages: ['English', 'Spanish'],
      education: 'Ph.D. in Clinical Psychology, University of California',
      licenses: 'Licensed Clinical Social Worker (LCSW) - California',
      experience: 10,
      rating: 4.8,
      reviewCount: 127,
      sessionRate: '$120/session'
    }
  })

  console.log('✅ Created therapist user:', therapistUser.email)

  // Create demo patient
  const patientPassword = await hashPassword('patient123!')
  const patientUser = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      password: patientPassword,
      name: 'John Doe',
      roles: ['patient'],
      status: 'active',
      emailVerified: true,
      tenantId: defaultTenant.id,
      dateOfBirth: new Date('1990-05-15'),
      emergencyContact: 'Jane Doe - 555-0123',
      goals: 'Manage anxiety and improve coping strategies'
    }
  })

  console.log('✅ Created patient user:', patientUser.email)

  // Create therapist availability
  const availabilitySlots = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }, // Monday morning
    { dayOfWeek: 1, startTime: '13:00', endTime: '17:00' }, // Monday afternoon
    { dayOfWeek: 2, startTime: '09:00', endTime: '12:00' }, // Tuesday morning
    { dayOfWeek: 2, startTime: '13:00', endTime: '17:00' }, // Tuesday afternoon
    { dayOfWeek: 3, startTime: '09:00', endTime: '12:00' }, // Wednesday morning
    { dayOfWeek: 3, startTime: '13:00', endTime: '17:00' }, // Wednesday afternoon
    { dayOfWeek: 4, startTime: '09:00', endTime: '12:00' }, // Thursday morning
    { dayOfWeek: 4, startTime: '13:00', endTime: '17:00' }, // Thursday afternoon
    { dayOfWeek: 5, startTime: '09:00', endTime: '12:00' }, // Friday morning
  ]

  for (const slot of availabilitySlots) {
    await prisma.availability.upsert({
      where: {
        therapistId_dayOfWeek_startTime: {
          therapistId: therapistUser.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime
        }
      },
      update: {},
      create: {
        ...slot,
        therapistId: therapistUser.id
      }
    })
  }

  console.log('✅ Created therapist availability')

  // Create demo appointment
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 1) // Tomorrow
  futureDate.setHours(14, 0, 0, 0) // 2 PM

  const demoAppointment = await prisma.appointment.create({
    data: {
      datetime: futureDate,
      duration: 60,
      type: 'therapy',
      status: 'confirmed',
      notes: 'Follow-up session for anxiety management',
      patientId: patientUser.id,
      therapistId: therapistUser.id,
      tenantId: defaultTenant.id
    }
  })

  console.log('✅ Created demo appointment')

  // Create message thread
  const messageThread = await prisma.thread.create({
    data: {
      tenantId: defaultTenant.id,
      participants: {
        create: [
          { userId: patientUser.id },
          { userId: therapistUser.id }
        ]
      }
    }
  })

  // Create demo messages
  await prisma.message.createMany({
    data: [
      {
        content: 'Hello Dr. Johnson, I wanted to follow up on our last session.',
        threadId: messageThread.id,
        senderId: patientUser.id,
        tenantId: defaultTenant.id,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        content: 'Hi John! Thank you for reaching out. How have you been feeling since our last session?',
        threadId: messageThread.id,
        senderId: therapistUser.id,
        tenantId: defaultTenant.id,
        readAt: new Date(),
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        content: 'I\'ve been practicing the breathing exercises you taught me, and they\'re really helping with my anxiety.',
        threadId: messageThread.id,
        senderId: patientUser.id,
        tenantId: defaultTenant.id,
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }
    ]
  })

  console.log('✅ Created demo messages')

  // Create demo assessment
  const phq9Responses = {
    q1: 1, // Little interest or pleasure in doing things
    q2: 2, // Feeling down, depressed, or hopeless
    q3: 1, // Trouble falling or staying asleep
    q4: 0, // Feeling tired or having little energy
    q5: 1, // Poor appetite or overeating
    q6: 0, // Feeling bad about yourself
    q7: 1, // Trouble concentrating
    q8: 0, // Moving or speaking slowly
    q9: 0  // Thoughts of self-harm
  }

  const phq9Score = Object.values(phq9Responses).reduce((sum, val) => sum + val, 0)
  let phq9Severity
  if (phq9Score <= 4) phq9Severity = 'minimal'
  else if (phq9Score <= 9) phq9Severity = 'mild'
  else if (phq9Score <= 14) phq9Severity = 'moderate'
  else if (phq9Score <= 19) phq9Severity = 'moderately-severe'
  else phq9Severity = 'severe'

  await prisma.assessment.create({
    data: {
      type: 'phq9',
      responses: phq9Responses,
      score: phq9Score,
      severity: phq9Severity,
      patientId: patientUser.id,
      tenantId: defaultTenant.id
    }
  })

  console.log('✅ Created demo PHQ-9 assessment')

  // Create demo mood check-ins
  const moodCheckins = [
    { mood: 3, notes: 'Feeling okay today', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { mood: 4, notes: 'Good day, therapy session helped', createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
    { mood: 2, notes: 'Struggling with anxiety', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { mood: 4, notes: 'Much better after practicing breathing exercises', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
    { mood: 3, notes: 'Average day', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { mood: 4, notes: 'Feeling positive', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { mood: 5, notes: 'Great day! Feeling very optimistic', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
  ]

  for (const checkin of moodCheckins) {
    await prisma.moodCheckin.create({
      data: {
        ...checkin,
        patientId: patientUser.id,
        tenantId: defaultTenant.id
      }
    })
  }

  console.log('✅ Created demo mood check-ins')

  console.log('🎉 Database seeded successfully!')
  console.log('\n📋 Demo Accounts:')
  console.log('👨‍💼 Admin: admin@mindlink.com / admin123!')
  console.log('👩‍⚕️ Therapist: sarah.johnson@mindlink.com / therapist123!')
  console.log('👤 Patient: john.doe@example.com / patient123!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

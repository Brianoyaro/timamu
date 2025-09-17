/**
 * Seed script for therapy specializations and assignment types
 * Populates the normalized therapy system with professional categories
 */

const { prisma } = require('../utils/database');
const logger = require('../utils/logger');

const specializationsData = [
  // General Therapy
  {
    code: 'GEN001',
    name: 'General Therapy',
    category: 'general',
    description: 'General mental health counseling and support',
    requiresSpecialCert: false,
    emergencyAccess: false,
    maxConcurrentPatients: 20
  },
  
  // Specialized Therapy
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
  
  // Emergency/Crisis Intervention
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
  
  // Specialized Conditions
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

const assignmentTypesData = [
  {
    code: 'primary',
    name: 'Primary Care',
    description: 'Long-term primary mental health care relationship',
    priority: 1,
    allowsConcurrent: false,
    requiresApproval: false,
    defaultMaxSessions: null, // Unlimited
    defaultDurationDays: null // Indefinite
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

async function seedSpecializations() {
  try {
    logger.info('🌱 Starting specializations seed...');
    
    // Seed therapy specializations
    logger.info('📋 Seeding therapy specializations...');
    for (const spec of specializationsData) {
      await prisma.therapySpecialization.upsert({
        where: { code: spec.code },
        update: spec,
        create: spec
      });
      logger.info(`✅ Created/updated specialization: ${spec.name}`);
    }
    
    // Seed assignment types
    logger.info('🔗 Seeding assignment types...');
    for (const type of assignmentTypesData) {
      await prisma.assignmentType.upsert({
        where: { code: type.code },
        update: type,
        create: type
      });
      logger.info(`✅ Created/updated assignment type: ${type.name}`);
    }
    
    logger.info('🎉 Specializations seed completed successfully!');
    
    // Display summary
    const specsCount = await prisma.therapySpecialization.count();
    const typesCount = await prisma.assignmentType.count();
    
    logger.info(`📊 Summary:`);
    logger.info(`   - Therapy Specializations: ${specsCount}`);
    logger.info(`   - Assignment Types: ${typesCount}`);
    
  } catch (error) {
    logger.error('❌ Specializations seed failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedSpecializations()
    .then(() => {
      logger.info('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

module.exports = { seedSpecializations };

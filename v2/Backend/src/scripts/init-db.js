#!/usr/bin/env node

/**
 * Database initialization script
 * Sets up the database and runs initial migrations
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkDatabase() {
  console.log('🔍 Checking database connection...');
  
  try {
    await runCommand('npx', ['prisma', 'db', 'push', '--accept-data-loss']);
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('❌ Database connection failed');
    return false;
  }
}

async function generatePrismaClient() {
  console.log('🔧 Generating Prisma client...');
  
  try {
    await runCommand('npx', ['prisma', 'generate']);
    console.log('✅ Prisma client generated');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
    throw error;
  }
}

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  
  try {
    await runCommand('npx', ['prisma', 'db', 'push']);
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error.message);
    throw error;
  }
}

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  try {
    await runCommand('node', ['src/scripts/seed.js']);
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed database:', error.message);
    console.log('ℹ️  You can run seeding manually later with: npm run seed');
  }
}

async function checkEnvironment() {
  const envPath = path.join(__dirname, '..', '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    console.log('ℹ️  Please copy .env.example to .env and configure your environment variables');
    return false;
  }

  // Read and validate essential environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      return false;
    }
  }

  console.log('✅ Environment configuration looks good');
  return true;
}

async function main() {
  console.log('🚀 Initializing Telepsychology Platform Database...\n');

  try {
    // Check environment
    const envOk = await checkEnvironment();
    if (!envOk) {
      process.exit(1);
    }

    // Generate Prisma client
    await generatePrismaClient();

    // Check database connection
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.log('\n⚠️  Database connection failed. Please ensure:');
      console.log('   1. PostgreSQL is running');
      console.log('   2. DATABASE_URL in .env is correct');
      console.log('   3. Database exists and is accessible');
      process.exit(1);
    }

    // Run migrations
    await runMigrations();

    // Seed database
    await seedDatabase();

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\nYou can now start the development server with:');
    console.log('   npm run dev');

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };

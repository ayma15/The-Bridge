const prisma = require('../server/config/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test connection by querying the database time
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful!');
    console.log('Current database time:', result[0].current_time);
    
    // List all users (should be empty initially)
    const users = await prisma.user.findMany();
    console.log('\n📋 Users in the database:', users.length);
    console.log(users);
    
    // List all tables in the database
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('\n📊 Database tables:');
    console.table(tables);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

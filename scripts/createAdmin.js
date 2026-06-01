const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdmin() {
  try {
    console.log('Creating admin user...\n');
    
    rl.question('Enter admin email: ', async (email) => {
      rl.question('Enter admin username: ', async (username) => {
        rl.question('Enter admin password: ', async (password) => {
          rl.close();
          
          try {
            // Check if admin already exists
            const existing = await prisma.user.findFirst({
              where: {
                OR: [
                  { email },
                  { username }
                ]
              }
            });
            
            if (existing) {
              console.log('❌ User with this email or username already exists!');
              await prisma.$disconnect();
              process.exit(1);
            }
            
            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);
            
            // Create admin user
            const admin = await prisma.user.create({
              data: {
                email,
                username,
                passwordHash,
                role: 'FULL_ADMIN',
                limitedPermissions: '[]',
                isVerified: true,
                isActive: true
              }
            });
            
            // Create wallet for admin
            await prisma.wallet.create({
              data: {
                userId: admin.id,
                balance: 0,
                currency: 'POINTS'
              }
            });
            
            console.log('\n✅ Admin user created successfully!');
            console.log(`   ID: ${admin.id}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Username: ${admin.username}`);
            console.log(`   Role: ${admin.role}\n`);
            
          } catch (error) {
            console.error('❌ Error creating admin:', error.message);
          } finally {
            await prisma.$disconnect();
          }
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();





const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupPostgreSQL() {
  console.log('\n🐘 PostgreSQL Database Setup\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Get PostgreSQL credentials
    const host = await question('PostgreSQL Host (default: localhost): ') || 'localhost';
    const port = await question('PostgreSQL Port (default: 5432): ') || '5432';
    const database = await question('Database Name (e.g., allinone): ');
    const username = await question('PostgreSQL Username: ');
    const password = await question('PostgreSQL Password: ');
    
    if (!database || !username || !password) {
      console.log('\n❌ Error: Database name, username, and password are required!');
      rl.close();
      process.exit(1);
    }
    
    // Build connection string
    const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}?schema=public`;
    
    // Read current .env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(
        /DATABASE_URL=.*/,
        `DATABASE_URL="${connectionString}"`
      );
    } else {
      envContent += `\nDATABASE_URL="${connectionString}"\n`;
    }
    
    // Write updated .env
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Database connection string updated in .env file!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Next steps:\n');
    console.log('   1. Make sure PostgreSQL is running');
    console.log('   2. Create the database if it doesn\'t exist:');
    console.log(`      CREATE DATABASE ${database};`);
    console.log('   3. Run: npx prisma generate');
    console.log('   4. Run: npx prisma migrate dev\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

setupPostgreSQL();


const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testSetup() {
  console.log('🧪 Testing All in One Platform Setup...\n');
  
  const tests = [];
  
  // Test 1: API Health Check
  try {
    const response = await axios.get(`${API_URL}/`);
    tests.push({
      name: 'API Health Check',
      status: response.status === 200 ? '✅ PASS' : '❌ FAIL',
      details: response.data
    });
  } catch (error) {
    tests.push({
      name: 'API Health Check',
      status: '❌ FAIL',
      details: error.message
    });
  }
  
  // Test 2: Database Connection (via registration attempt)
  try {
    const testEmail = `test_${Date.now()}@test.com`;
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: testEmail,
      username: 'testuser',
      password: 'testpass123'
    });
    tests.push({
      name: 'Database Connection & User Registration',
      status: response.status === 201 ? '✅ PASS' : '❌ FAIL',
      details: 'User created successfully'
    });
    
    // Clean up test user
    // (In real scenario, you'd delete it, but for testing we'll leave it)
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      tests.push({
        name: 'Database Connection & User Registration',
        status: '✅ PASS',
        details: 'Database working (user might already exist)'
      });
    } else {
      tests.push({
        name: 'Database Connection & User Registration',
        status: '❌ FAIL',
        details: error.response?.data?.message || error.message
      });
    }
  }
  
  // Test 3: Authentication
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    tests.push({
      name: 'Authentication System',
      status: response.status === 200 ? '✅ PASS' : '❌ FAIL',
      details: 'Login endpoint working'
    });
  } catch (error) {
    if (error.response?.status === 401) {
      tests.push({
        name: 'Authentication System',
        status: '✅ PASS',
        details: 'Auth system working (invalid credentials rejected)'
      });
    } else {
      tests.push({
        name: 'Authentication System',
        status: '⚠️ PARTIAL',
        details: error.response?.data?.message || error.message
      });
    }
  }
  
  // Test 4: Search Endpoint
  try {
    const response = await axios.get(`${API_URL}/api/search`, {
      params: { q: 'test', type: 'all' }
    });
    tests.push({
      name: 'Search Functionality',
      status: response.status === 200 ? '✅ PASS' : '❌ FAIL',
      details: 'Search endpoint working'
    });
  } catch (error) {
    tests.push({
      name: 'Search Functionality',
      status: '❌ FAIL',
      details: error.response?.data?.message || error.message
    });
  }
  
  // Test 5: Wallet Endpoint (should require auth)
  try {
    const response = await axios.get(`${API_URL}/api/wallet/balance`);
    tests.push({
      name: 'Wallet System',
      status: response.status === 401 ? '✅ PASS' : '⚠️ PARTIAL',
      details: 'Auth protection working'
    });
  } catch (error) {
    if (error.response?.status === 401) {
      tests.push({
        name: 'Wallet System',
        status: '✅ PASS',
        details: 'Auth protection working correctly'
      });
    } else {
      tests.push({
        name: 'Wallet System',
        status: '❌ FAIL',
        details: error.response?.data?.message || error.message
      });
    }
  }
  
  // Print Results
  console.log('\n📊 Test Results:\n');
  tests.forEach(test => {
    console.log(`${test.status} ${test.name}`);
    if (test.details) {
      console.log(`   ${test.details}\n`);
    }
  });
  
  const passed = tests.filter(t => t.status.includes('✅')).length;
  const total = tests.length;
  
  console.log(`\n📈 Summary: ${passed}/${total} tests passed\n`);
  
  if (passed === total) {
    console.log('🎉 All systems operational! Your platform is ready to use.\n');
  } else {
    console.log('⚠️ Some tests failed. Check the details above.\n');
  }
}

// Run tests
testSetup().catch(console.error);


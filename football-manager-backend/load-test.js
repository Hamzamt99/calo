const axios = require('axios');
const { faker } = require('@faker-js/faker');

const TOTAL_REQUESTS = 10; 
const CONCURRENCY = 10;   

const runTest = async (index) => {
  const email = faker.internet.email().toLowerCase();
  const username = faker.internet.username().toLowerCase();
  const data = {
    email,
    password: 'SecurePa423ss123',
    name: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username,
  };

  try {
    const res = await axios.post('http://localhost:3000/api/auth', data);
    console.log(`[${index}] ✅ Success - ${res.status}`);
  } catch (err) {
    console.error(`[${index}] ❌ Failed - ${err?.response?.status || 'No Response'}`);
  }
};

const runLoadTest = async () => {
  let running = [];

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    running.push(runTest(i + 1));

    if (running.length >= CONCURRENCY) {
      await Promise.all(running);
      running = [];
    }
  }

  // Catch any leftover batch
  if (running.length) {
    await Promise.all(running);
  }

  console.log('✅ Load test completed.');
};

runLoadTest();

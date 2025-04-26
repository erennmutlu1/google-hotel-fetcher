const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3000;

const options = {
  hostname: '127.0.0.1',
  port: PORT,
  path: '/',
  method: 'GET'
};

console.log(`Testing connection to local server on port ${PORT}...`);
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE BODY:', data);
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});

req.end();

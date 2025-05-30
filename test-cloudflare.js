import https from 'https';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

console.log('Testing Cloudflare DNS creation for: cavolo.menuisland.it');

const recordData = {
  type: 'CNAME',
  name: 'cavolo',
  content: '427f86c9-cc01-4eee-85fa-a81383a9333f-00-1zam1z3mzexa9.riker.replit.dev',
  ttl: 300
};

const postData = JSON.stringify(recordData);

const options = {
  hostname: 'api.cloudflare.com',
  path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Creating DNS record:', recordData);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    try {
      const response = JSON.parse(data);
      console.log('API Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('\n✅ SUCCESS: Subdomain cavolo.menuisland.it created!');
        console.log('Record ID:', response.result.id);
        console.log('Full domain:', response.result.name);
      } else {
        console.log('\n❌ FAILED: Could not create subdomain');
        if (response.errors) {
          response.errors.forEach(error => {
            console.log(`Error ${error.code}: ${error.message}`);
          });
        }
      }
    } catch (parseError) {
      console.log('Failed to parse response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e.message);
});

req.write(postData);
req.end();
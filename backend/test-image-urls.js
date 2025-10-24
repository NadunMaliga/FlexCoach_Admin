const fetch = require('node-fetch');

async function testImageUrls() {
  const imageUrls = [
    'https://placekitten.com/300/400',
    'https://placekitten.com/301/400',
    'https://placekitten.com/302/400',
    'https://placekitten.com/310/410',
    'https://placekitten.com/311/410',
    'https://placekitten.com/312/410'
  ];

  console.log('🧪 Testing image URLs...');

  for (const url of imageUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`${response.ok ? '✅' : '❌'} ${url} - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
    }
  }
}

testImageUrls();
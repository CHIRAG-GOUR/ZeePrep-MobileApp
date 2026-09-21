import * as ftp from 'basic-ftp';

async function testConnection() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('Connecting to ftp.skillizee.io...');
    await client.access({
      host: 'ftp.skillizee.io',
      user: 'u460407084.zeeprep',
      password: '3S@EaVDHk79jmDP',
      port: 21,
      secure: false, // will negotiate or fall back cleanly
    });

    console.log('✓ Authentication successful!');
    const pwd = await client.pwd();
    console.log('Current remote working directory (PWD):', pwd);

    const list = await client.list();
    console.log('\nRemote Directory Listing:');
    for (const item of list) {
      console.log(` - ${item.isDirectory ? '[DIR]' : '[FILE]'} ${item.name} (${item.size} bytes)`);
    }
  } catch (err) {
    console.error('Connection test failed:', err);
  } finally {
    client.close();
  }
}

testConnection();

import * as ftp from 'basic-ftp';

async function testConnection() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('Connecting to Hostinger IP: 187.124.193.92 ...');
    await client.access({
      host: '187.124.193.92',
      user: 'u460407084.zeeprep',
      password: '3S@EaVDHk79jmDP',
      port: 21,
      secure: false, // fallback to standard or explicit TLS if supported
    });

    console.log('\n🎉 SUCCESS! Authenticated with Hostinger FTP.');
    const pwd = await client.pwd();
    console.log('Remote PWD:', pwd);

    const list = await client.list();
    console.log('\nDirectory Listing:');
    for (const item of list) {
      console.log(` - ${item.isDirectory ? '[DIR]' : '[FILE]'} ${item.name} (${item.size} bytes)`);
    }
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    client.close();
  }
}

testConnection();

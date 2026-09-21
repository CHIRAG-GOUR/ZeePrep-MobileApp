import * as ftp from 'basic-ftp';

const hostsToTry = [
  'access.hostinger.com',
  'connect.hostinger.com',
  'ftp.hostinger.com',
  'skillizee.io',
];

async function tryHosts() {
  for (const host of hostsToTry) {
    console.log(`\nTesting host: ${host}...`);
    const client = new ftp.Client();
    client.ftp.timeout = 7000;
    try {
      await client.access({
        host,
        user: 'u460407084.zeeprep',
        password: '3S@EaVDHk79jmDP',
        port: 21,
        secure: false,
      });
      console.log(`🎉 SUCCESS! Connected via host: ${host}`);
      const pwd = await client.pwd();
      console.log('Remote PWD:', pwd);
      const list = await client.list();
      console.log('Files:');
      list.forEach(i => console.log(' -', i.name));
      client.close();
      return host;
    } catch (e) {
      console.log(`Failed on ${host}:`, e.message);
      client.close();
    }
  }
}

tryHosts();

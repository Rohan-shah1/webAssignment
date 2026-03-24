const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.log('Usage: node hash_password.js <your_password>');
    process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('--- Password Hash Generator ---');
console.log('Password:', password);
console.log('Hashed (with salt):', hash);
console.log('-------------------------------');
console.log('Copy the hash above into your .env file as ADMIN_PASS');

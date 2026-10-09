/**
 * Create / promote a Super Admin directly in MongoDB.
 * Super admins are intentionally not creatable via API.
 *
 * Usage:
 *   node scripts/ensure-super-admin.js --email=admin@example.com --name="Super Admin"
 *
 * Requires MONGODB_URL (or MONGO_URI) in env / .env
 */
require('dotenv').config();
const mongoose = require('mongoose');

const email = (process.argv.find((a) => a.startsWith('--email=')) || '')
  .replace('--email=', '')
  .trim()
  .toLowerCase();
const name = (
  process.argv.find((a) => a.startsWith('--name=')) || '--name=Super Admin'
)
  .replace('--name=', '')
  .trim();

if (!email) {
  console.error('Missing --email=...');
  process.exit(1);
}

const uri = process.env.MONGODB_URL || process.env.MONGO_URI;
if (!uri) {
  console.error('MONGODB_URL / MONGO_URI is required');
  process.exit(1);
}

async function main() {
  await mongoose.connect(uri);
  const User = require('../src/models/user.model');
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      isSuperAdmin: true,
      userType: 'admin',
      isSellerAdmin: false,
      status: 1,
      isEmailVerified: true,
    });
    console.log('Created super admin:', user.email);
  } else {
    user.isSuperAdmin = true;
    user.userType = 'admin';
    user.isSellerAdmin = false;
    user.status = 1;
    await user.save();
    console.log('Promoted existing user to super admin:', user.email);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

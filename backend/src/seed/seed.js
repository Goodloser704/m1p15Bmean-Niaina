const bcrypt = require("bcryptjs");
const { connectToDb } = require("../config/db");
const { mongodbUri } = require("../config/env");
const User = require("../models/User");

async function upsertUser({ fullName, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  await User.updateOne(
    { email },
    { $set: { fullName, email, passwordHash, role } },
    { upsert: true }
  );
}

async function main() {
  await connectToDb(mongodbUri);

  await upsertUser({
    fullName: "Client Démo",
    email: "client@demo.com",
    password: "client123",
    role: "client"
  });

  await upsertUser({
    fullName: "Mécanicien Démo",
    email: "mechanic@demo.com",
    password: "mechanic123",
    role: "mechanic"
  });

  await upsertUser({
    fullName: "Manager Démo",
    email: "manager@demo.com",
    password: "manager123",
    role: "manager"
  });

  console.log("Seed OK: 3 users created/updated");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


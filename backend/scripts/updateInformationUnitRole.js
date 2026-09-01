/**
 * One-off maintenance script: promote the Information Unit account
 * (information@gmail.com) from the legacy "admin" role to the dedicated
 * "information_unit" role so it can access /information-unit and the
 * achievement review APIs.
 *
 * Usage: node scripts/updateInformationUnitRole.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/user");

const EMAIL = "information@gmail.com";
const NEW_ROLE = "information_unit";

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Aborting.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to MongoDB. Updating ${EMAIL} role...`);

  const result = await User.updateOne(
    { email: EMAIL },
    { $set: { role: NEW_ROLE } },
  );

  if (result.matchedCount === 0) {
    console.error(`No user found with email ${EMAIL}.`);
  } else if (result.modifiedCount === 0) {
    const existing = await User.findOne({ email: EMAIL }).lean();
    console.log(
      `User already has role "${existing?.role}". No change applied.`,
    );
  } else {
    console.log(`Updated ${EMAIL} to role "${NEW_ROLE}".`);
  }

  const user = await User.findOne({ email: EMAIL }).lean();
  console.log("Current account state:", {
    name: user?.name,
    email: user?.email,
    role: user?.role,
  });

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});

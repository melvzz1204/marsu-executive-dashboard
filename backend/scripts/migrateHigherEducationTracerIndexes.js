/**
 * One-off migration: make the graduate employability tracer program-aware.
 *
 * Before program-specific tracing, each tracer document was unique by year
 * alone. The model now stores one document per year + program + campus, so the
 * legacy unique `year_1` index must be dropped or it will reject multiple
 * programs for the same year.
 *
 * This script:
 *   1. Backfills programName/campusBranch on existing rows.
 *   2. Drops the legacy unique `year_1` index (if present).
 *   3. Syncs the compound unique index { year, programName, campusBranch }.
 *
 * Usage: node scripts/migrateHigherEducationTracerIndexes.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const HigherEducationTracer = require("../src/models/higherEducation/higherEducationTracerModel");
const {
  ALL_PROGRAMS_LABEL,
  ALL_CAMPUSES_LABEL,
} = require("../src/services/higherEducation/tracerAggregation");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Aborting.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB. Migrating HigherEducationTracer...");

  const backfill = await HigherEducationTracer.updateMany(
    {
      $or: [
        { programName: { $exists: false } },
        { programName: null },
        { programName: "" },
        { campusBranch: { $exists: false } },
        { campusBranch: null },
        { campusBranch: "" },
      ],
    },
    {
      $set: {
        programName: ALL_PROGRAMS_LABEL,
        campusBranch: ALL_CAMPUSES_LABEL,
      },
    },
  );
  console.log(`Backfilled ${backfill.modifiedCount} tracer record(s).`);

  const collection = HigherEducationTracer.collection;
  const indexes = await collection.indexes();
  const legacy = indexes.find(
    (index) =>
      index.unique &&
      Object.keys(index.key).length === 1 &&
      index.key.year === 1,
  );

  if (legacy) {
    await collection.dropIndex(legacy.name);
    console.log(`Dropped legacy unique index "${legacy.name}".`);
  } else {
    console.log("No legacy unique year index found. Skipping drop.");
  }

  await HigherEducationTracer.syncIndexes();
  console.log("Indexes synced to the program-aware schema.");

  await mongoose.disconnect();
  console.log("Disconnected. Migration complete.");
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});

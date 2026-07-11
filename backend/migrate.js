const { execSync } = require("child_process");
require("dotenv").config();

const schema = "--schema=prisma/schema.prisma";

async function main() {
  // Step 1: Try deploy normally
  try {
    console.log("Attempting prisma migrate deploy...");
    execSync(`npx prisma migrate deploy ${schema}`, { stdio: "inherit" });
    console.log("Migrations applied successfully.");
    return;
  } catch {
    console.log("Deploy failed. Resetting migration history...");
  }

  // Step 2: Clear the _prisma_migrations table so Prisma treats this as fresh
  try {
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query('DELETE FROM "_prisma_migrations"');
    console.log("  Cleared _prisma_migrations table");
    await pool.end();
  } catch (err) {
    console.log("  Could not clear _prisma_migrations:", err.message);
    process.exit(1);
  }

  // Step 3: Deploy the fresh init migration
  console.log("\nApplying fresh migration...");
  try {
    execSync(`npx prisma migrate deploy ${schema}`, { stdio: "inherit" });
    console.log("All migrations applied successfully.");
  } catch (err) {
    console.error("Migration deploy failed:", err.message);
    process.exit(1);
  }
}

main();

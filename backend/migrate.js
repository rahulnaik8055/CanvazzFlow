const { execSync } = require("child_process");

const MIGRATIONS = [
  "20260503043347_init",
  "20260505184125_project_access_management",
  "20260425092747_add_node_model",
  "20260706183327_add_notification_model",
  "20260706190403_add_request_status_fields",
  "20260706191719_add_request_events",
  "20260706193247_add_project_invitations",
  "20260706194559_add_project_member_fields",
  "20260706201945_add_pinned_and_page_visits",
];

const schema = "--schema=prisma/schema.prisma";

// Try deploy first
try {
  console.log("Attempting prisma migrate deploy...");
  execSync(`npx prisma migrate deploy ${schema}`, { stdio: "inherit" });
  console.log("Migrations applied successfully.");
  process.exit(0);
} catch {
  console.log("Deploy failed. Baselining existing migrations...");
}

// Baseline each migration (ignore errors for already-applied ones)
for (const name of MIGRATIONS) {
  try {
    execSync(`npx prisma migrate resolve --applied "${name}" ${schema}`, {
      stdio: "inherit",
    });
    console.log(`  Baseline: ${name}`);
  } catch {
    console.log(`  Skip: ${name} (already baselined)`);
  }
}

// Deploy again — only the new migration should run
console.log("\nApplying pending migrations...");
try {
  execSync(`npx prisma migrate deploy ${schema}`, { stdio: "inherit" });
  console.log("All migrations applied successfully.");
} catch (err) {
  console.error("Migration deploy failed after baselining:", err.message);
  process.exit(1);
}

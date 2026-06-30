/**
 * Seed Demo Users Script
 * ─────────────────────────────────────────────────────────────────────
 * Creates demo users in the Cognito User Pool with confirmed status,
 * bypassing email verification. Each user is assigned to the correct
 * Cognito group for role-based access.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-users.ts
 *
 * Prerequisites:
 *   - AWS credentials configured (via env vars, profile, or SSO)
 *   - Cognito User Pool must exist (uses amplify_outputs.json config)
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Load Amplify Outputs for User Pool config ─────────────────────
const amplifyOutputsPath = resolve(
  import.meta.dirname,
  "../apps/nettribexyz/amplify_outputs.json"
);

let amplifyOutputs: { auth: { user_pool_id: string; aws_region: string } };
try {
  amplifyOutputs = JSON.parse(readFileSync(amplifyOutputsPath, "utf-8"));
} catch {
  console.error(
    "❌ Could not read amplify_outputs.json. Make sure the Amplify sandbox is deployed."
  );
  process.exit(1);
}

const USER_POOL_ID = amplifyOutputs.auth.user_pool_id;
const REGION = amplifyOutputs.auth.aws_region;

console.log(`\n🔧 Using Cognito User Pool: ${USER_POOL_ID} (${REGION})\n`);

// ─── Demo Users Definition ──────────────────────────────────────────
interface DemoUser {
  email: string;
  password: string;
  fullName: string;
  role: string;
  group: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: "rider@nettribe.demo",
    password: "RiderDemo123!",
    fullName: "Alex Rider",
    role: "rider",
    group: "rider",
  },
  {
    email: "investor@nettribe.demo",
    password: "InvestorDemo123!",
    fullName: "Jordan Capital",
    role: "investor",
    group: "investor",
  },
  {
    email: "offsetter@nettribe.demo",
    password: "OffsetterDemo123!",
    fullName: "GreenCorp Ltd",
    role: "offsetter",
    group: "offsetter",
  },
  {
    email: "user@nettribe.demo",
    password: "UserDemo123!",
    fullName: "Sam Trader",
    role: "user",
    group: "investor", // 'user' isn't a cognito group, fallback to investor
  },
  {
    email: "admin@nettribe.demo",
    password: "AdminDemo123!",
    fullName: "Net Tribe Admin",
    role: "admin",
    group: "admin",
  },
];

// ─── Cognito Client ─────────────────────────────────────────────────
const client = new CognitoIdentityProviderClient({ region: REGION });

async function userExists(email: string): Promise<boolean> {
  try {
    await client.send(
      new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      })
    );
    return true;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.name === "UserNotFoundException"
    ) {
      return false;
    }
    throw err;
  }
}

async function createDemoUser(user: DemoUser): Promise<void> {
  const { email, password, fullName, role, group } = user;

  // Check if user already exists
  if (await userExists(email)) {
    console.log(`  ⏭️  ${email} already exists — skipping`);
    return;
  }

  // Step 1: Create the user (suppress welcome email since these are demo accounts)
  await client.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "name", Value: fullName },
        { Name: "custom:role", Value: role },
      ],
      MessageAction: "SUPPRESS", // Don't send welcome email
    })
  );

  // Step 2: Set a permanent password (bypasses FORCE_CHANGE_PASSWORD state)
  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    })
  );

  // Step 3: Add user to the appropriate Cognito group
  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      GroupName: group,
    })
  );

  console.log(`  ✅ ${email} — created (group: ${group})`);
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding demo users into Cognito...\n");

  let successCount = 0;
  let errorCount = 0;

  for (const user of DEMO_USERS) {
    try {
      await createDemoUser(user);
      successCount++;
    } catch (err: unknown) {
      errorCount++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ ${user.email} — FAILED: ${message}`);
    }
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(`Done! ${successCount} succeeded, ${errorCount} failed.`);
  console.log(`────────────────────────────────────────\n`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main();

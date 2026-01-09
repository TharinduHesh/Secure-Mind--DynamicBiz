// scripts/fix-roles.js
// Script to restore user roles from employee records after accidental bulk role update
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load service account
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : path.resolve(__dirname, "../serviceAccount.json");

const cred = JSON.parse(fs.readFileSync(keyPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({ 
    credential: admin.credential.cert(cred)
  });
}

const db = admin.firestore();

const ALLOWED_ROLES = ["admin", "trainer", "security", "accounting", "marketing", "developer", "design", "user"];

function normalizeRole(role, fallback = "user") {
  const r = String(role || "").toLowerCase();
  return ALLOWED_ROLES.includes(r) ? r : fallback;
}

async function fixRoles() {
  console.log("🔧 Starting role restoration process...\n");
  
  try {
    // Get all users
    const usersSnapshot = await db.collection("users").get();
    console.log(`Found ${usersSnapshot.size} users in database`);
    
    // Get all employees
    const employeesSnapshot = await db.collection("employees").get();
    console.log(`Found ${employeesSnapshot.size} employees in database\n`);
    
    // Create email to employee mapping
    const employeesByEmail = {};
    const employeesById = {};
    
    employeesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) {
        employeesByEmail[data.email.toLowerCase()] = { id: doc.id, ...data };
      }
      employeesById[doc.id] = { id: doc.id, ...data };
    });
    
    console.log("📊 Processing user role assignments...\n");
    
    let fixed = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;
      const email = userData.email?.toLowerCase();
      const employeeId = userData.employeeId;
      const currentRole = userData.role;
      
      console.log(`Processing user: ${userData.email || uid}`);
      console.log(`  Current role: ${currentRole}`);
      
      let correctRole = null;
      let employeeData = null;
      
      // Try to find employee by employeeId first
      if (employeeId && employeesById[employeeId]) {
        employeeData = employeesById[employeeId];
        correctRole = normalizeRole(employeeData.role);
        console.log(`  Found by employeeId ${employeeId}: ${correctRole}`);
      }
      // Fallback to email lookup
      else if (email && employeesByEmail[email]) {
        employeeData = employeesByEmail[email];
        correctRole = normalizeRole(employeeData.role);
        console.log(`  Found by email ${email}: ${correctRole}`);
      } else {
        console.log(`  ⚠️  No employee record found - keeping current role: ${currentRole}`);
        skipped++;
        continue;
      }
      
      // Check if role needs updating
      if (currentRole === correctRole) {
        console.log(`  ✅ Role already correct: ${correctRole}`);
        skipped++;
        continue;
      }
      
      try {
        // Update Firebase Auth custom claims
        await admin.auth().setCustomUserClaims(uid, { role: correctRole });
        
        // Update Firestore user document
        await userDoc.ref.update({
          role: correctRole,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastRoleUpdate: admin.firestore.FieldValue.serverTimestamp(),
          roleFixedBy: 'fix-roles-script'
        });
        
        // Link employee record if needed
        if (employeeData && (!userData.employeeId || userData.employeeId !== employeeData.id)) {
          await userDoc.ref.update({
            employeeId: employeeData.id,
            department: employeeData.department || null,
            team: employeeData.team || null
          });
          
          // Update employee record to link back to user
          await db.collection("employees").doc(employeeData.id).update({
            uid: uid,
            linkedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        console.log(`  ✅ Updated ${currentRole} → ${correctRole}`);
        fixed++;
        
      } catch (error) {
        console.log(`  ❌ Failed to update: ${error.message}`);
        errors++;
      }
      
      console.log(""); // Empty line for readability
    }
    
    console.log("🎉 Role restoration complete!");
    console.log(`✅ Fixed: ${fixed} users`);
    console.log(`⚠️  Skipped: ${skipped} users`);
    console.log(`❌ Errors: ${errors} users`);
    
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
fixRoles().catch(error => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});
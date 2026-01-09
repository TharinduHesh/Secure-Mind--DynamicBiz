/* functions/index.js */
/* eslint-disable no-console */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://mind-76cce.web.app",
    "https://mind-76cce.firebaseapp.com",
  ],
  credentials: true,
});

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/** ---------- Helpers ---------- **/
const ALLOWED_ROLES = ["admin", "trainer", "security", "accounting", "marketing", "developer", "design", "user"];

function normalizeRole(role, fallback = "user") {
  const r = String(role || "").toLowerCase();
  return ALLOWED_ROLES.includes(r) ? r : fallback;
}

function assertRole(context, role) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required");
  }
  const tokenRole = context.auth.token?.role;
  if (tokenRole !== role) {
    throw new functions.https.HttpsError("permission-denied", "Insufficient role");
  }
}

// Check if user has elevated permissions
function assertElevatedRole(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required");
  }
  const tokenRole = context.auth.token?.role;
  if (!["admin", "trainer"].includes(tokenRole)) {
    throw new functions.https.HttpsError("permission-denied", "Admin or trainer role required");
  }
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function batchWrite(docs) {
  const CHUNK = 500;
  for (const group of chunk(docs, CHUNK)) {
    const batch = db.batch();
    for (const { ref, data } of group) batch.set(ref, data);
    await batch.commit();
  }
}

async function getUserIdsByRoles(roles) {
  const roleList = (roles || []).map((r) => String(r).toLowerCase()).filter(Boolean);
  if (roleList.length === 0) return [];
  const groups = chunk(roleList, 10); // Firestore "in" max
  const results = await Promise.all(
    groups.map((g) => db.collection("users").where("role", "in", g).get())
  );
  const ids = new Set();
  results.forEach((snap) => snap.forEach((d) => ids.add(d.id)));
  return Array.from(ids);
}

/** ---------- MFA Email OTP Helpers ---------- **/
const crypto = require("crypto");
let mailer = null;

function getSmtpConfig() {
  
  const cfg = {
    host: process.env.SMTP_HOST || functions.config()?.smtp?.host || "",
    port: Number(process.env.SMTP_PORT || functions.config()?.smtp?.port || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || functions.config()?.smtp?.user || "",
      pass: process.env.SMTP_PASS || functions.config()?.smtp?.pass || "",
    },
    from: process.env.SMTP_FROM || functions.config()?.smtp?.from || process.env.SMTP_USER || "",
  };
  return cfg;
}

async function getTransporter() {
  if (mailer) return mailer;
  const nodemailer = require("nodemailer");
  const cfg = getSmtpConfig();
  mailer = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: cfg.auth.user && cfg.auth.pass ? cfg.auth : undefined,
  });
  return mailer;
}

function generateOtpCode() {
  // 6-digit, zero-padded
  const n = Math.floor(Math.random() * 1000000);
  return n.toString().padStart(6, "0");
}

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function sendOtpEmail(toEmail, code) {
  const cfg = getSmtpConfig();
  const transporter = await getTransporter();
  const subject = "Your SecureMind verification code";
  const text = `Your verification code is ${code}. It expires in 1 minute.`;
  const html = `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;padding:16px">
    <h2>SecureMind verification</h2>
    <p>Your one-time code is</p>
    <div style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</div>
    <p style="margin-top:12px;color:#555">This code expires in 1 minute. If you didn't request it, you can ignore this email.</p>
  </div>`;
  await transporter.sendMail({ from: cfg.from || cfg.auth.user, to: toEmail, subject, text, html });
}

const OTP_COLLECTION = "mfa_email_otp";
const REMEMBER_COLLECTION = "mfa_remember";

/** ---------- Auth trigger: set role from employees + seed user doc ---------- **/
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  // 1) Default role from preapprovals if present
  const pre = await db.collection("preapprovals").doc(user.uid).get();
  let derivedRole = normalizeRole(pre.exists ? pre.data()?.role : null, "user");
  let employeeId = null;
  let department = null;
  let team = null;

  // 2) Try to derive role from employees directory using user.email
  try {
    const email = (user.email || "").trim().toLowerCase();
    if (email) {
      const snap = await db.collection("employees").where("email", "==", email).limit(1).get();
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const emp = docSnap.data() || {};
        employeeId = docSnap.id;
        department = emp.department || null;
        team = emp.team || null;
        const empRole = normalizeRole(emp.role, derivedRole);
        derivedRole = empRole;
        // Link employee record to uid for future lookups
        await docSnap.ref.set({ uid: user.uid, linkedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
    }
  } catch (e) {
    console.log("onUserCreate: employees lookup failed", e.message);
  }

  // 3) Set custom claims based on derived role
  await admin.auth().setCustomUserClaims(user.uid, { role: derivedRole });

  // 4) Seed users/{uid} with derived attributes (merge so later writes are preserved)
  await db.collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      email: user.email || null,
      firstName: null,
      lastName: null,
      role: derivedRole,
      employeeId: employeeId || admin.firestore.FieldValue.delete(),
      department: department || admin.firestore.FieldValue.delete(),
      team: team || admin.firestore.FieldValue.delete(),
      disabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
});

/** ---------- Admin: users ---------- **/
exports.adminCreateUser = functions.https.onCall(async (data, context) => {
  assertRole(context, "admin");
  const email = String(data?.email || "").trim().toLowerCase();
  if (!email) throw new functions.https.HttpsError("invalid-argument", "email required");
  const desiredRole = normalizeRole(data?.role, "user");
  const tempPassword = String(data?.tempPassword || "");
  const password = tempPassword || (Math.random().toString(36).slice(-12) + "A1!");
  const user = await admin.auth().createUser({ email, password, disabled: false });
  await admin.auth().setCustomUserClaims(user.uid, { role: desiredRole });

  await db.collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      email,
      role: desiredRole,
      disabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return { uid: user.uid, role: desiredRole };
});

exports.adminCreateUserHttp = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ error: "Missing authorization token" });

      const decoded = await admin.auth().verifyIdToken(token);
      if (decoded.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { email, password, firstName, lastName, employeeId, role } = req.body || {};

      if (!email || !password || !firstName || !lastName || !employeeId || !role) {
        return res.status(400).json({ error: "Missing required fields: email, password, firstName, lastName, employeeId, role" });
      }

      const normalizedRole = normalizeRole(role, "user");
      if (!ALLOWED_ROLES.includes(normalizedRole)) {
        return res.status(400).json({ error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}` });
      }

      const employeeDoc = await db.collection("employees").doc(employeeId).get();
      if (!employeeDoc.exists()) {
        return res.status(400).json({ error: "Employee ID not found" });
      }

      const employeeRole = normalizeRole(employeeDoc.data()?.role);
      if (employeeRole !== normalizedRole) {
        return res.status(400).json({ 
          error: `Role mismatch. Employee record shows role: ${employeeRole}, but requested: ${normalizedRole}` 
        });
      }

      const userRecord = await admin.auth().createUser({
        email: email.trim().toLowerCase(),
        password: password,
        displayName: `${firstName} ${lastName}`.trim(),
        emailVerified: false,
        disabled: false
      });

      await admin.auth().setCustomUserClaims(userRecord.uid, { 
        role: normalizedRole,
        [normalizedRole]: true
      });

      await db.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        employeeId: employeeId,
        role: normalizedRole,
        disabled: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: decoded.uid
      });

      await employeeDoc.ref.update({
        uid: userRecord.uid,
        linkedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({ 
        success: true, 
        uid: userRecord.uid,
        role: normalizedRole,
        message: "User created successfully" 
      });

    } catch (error) {
      console.error("Error creating user:", error);
      
      if (error.code === "auth/email-already-exists") {
        return res.status(400).json({ error: "Email already exists" });
      }
      if (error.code === "auth/invalid-email") {
        return res.status(400).json({ error: "Invalid email format" });
      }
      if (error.code === "auth/weak-password") {
        return res.status(400).json({ error: "Password is too weak" });
      }
      
      res.status(500).json({ 
        error: "Internal server error",
        details: error.message 
      });
    }
  });
});

exports.adminUpdateUser = functions.https.onCall(async (data, context) => {
  assertRole(context, "admin");
  const uid = String(data?.uid || "");
  if (!uid) throw new functions.https.HttpsError("invalid-argument", "uid required");

  const updates = {};
  if (typeof data?.disabled === "boolean") {
    await admin.auth().updateUser(uid, { disabled: data.disabled });
    updates.disabled = data.disabled;
  }
  if (data?.role) {
    const newRole = normalizeRole(data.role);
    await admin.auth().setCustomUserClaims(uid, { role: newRole });
    updates.role = newRole;
  }
  if (Object.keys(updates).length) {
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await db.collection("users").doc(uid).set(updates, { merge: true });
  }
  return { ok: true };
});

exports.adminUpdateUserHttp = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "PUT" && req.method !== "PATCH") {
      return res.status(405).json({ error: "Method not allowed. Use PUT or PATCH." });
    }
    
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ error: "Missing authorization token" });

      const decoded = await admin.auth().verifyIdToken(token);
      if (decoded.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { uid, disabled, role, firstName, lastName, email } = req.body || {};

      if (!uid) {
        return res.status(400).json({ error: "uid is required" });
      }

      const authUpdates = {};
      const firestoreUpdates = {};
      
      if (typeof disabled === "boolean") {
        authUpdates.disabled = disabled;
        firestoreUpdates.disabled = disabled;
      }

      if (role) {
        const normalizedRole = normalizeRole(role);
        if (!ALLOWED_ROLES.includes(normalizedRole)) {
          return res.status(400).json({ 
            error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(", ")}` 
          });
        }
        
        await admin.auth().setCustomUserClaims(uid, { 
          role: normalizedRole,
          [normalizedRole]: true 
        });
        firestoreUpdates.role = normalizedRole;
      }

      if (firstName) firestoreUpdates.firstName = firstName.trim();
      if (lastName) firestoreUpdates.lastName = lastName.trim();
      if (email) {
        authUpdates.email = email.trim().toLowerCase();
        firestoreUpdates.email = email.trim().toLowerCase();
      }

      if (firstName || lastName) {
        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.data() || {};
        const newFirstName = firstName || userData.firstName || "";
        const newLastName = lastName || userData.lastName || "";
        if (newFirstName || newLastName) {
          authUpdates.displayName = `${newFirstName} ${newLastName}`.trim();
        }
      }

      if (Object.keys(authUpdates).length > 0) {
        await admin.auth().updateUser(uid, authUpdates);
      }

      if (Object.keys(firestoreUpdates).length > 0) {
        firestoreUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        firestoreUpdates.updatedBy = decoded.uid;
        await db.collection("users").doc(uid).set(firestoreUpdates, { merge: true });
      }

      res.status(200).json({ 
        success: true,
        message: "User updated successfully",
        updatedFields: Object.keys({ ...authUpdates, ...firestoreUpdates })
      });

    } catch (error) {
      console.error("Error updating user:", error);
      
      if (error.code === "auth/user-not-found") {
        return res.status(404).json({ error: "User not found" });
      }
      if (error.code === "auth/invalid-email") {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      res.status(500).json({ 
        error: "Internal server error",
        details: error.message 
      });
    }
  });
});

exports.adminDeleteUser = functions.https.onCall(async (data, context) => {
  assertRole(context, "admin");
  const uid = String(data?.uid || "");
  if (!uid) throw new functions.https.HttpsError("invalid-argument", "uid required");
  await admin.auth().deleteUser(uid).catch(() => {});
  await db.collection("users").doc(uid).delete().catch(() => {});
  return { ok: true };
});

exports.adminDeleteUserHttp = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Method not allowed. Use DELETE." });
    }
    
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ error: "Missing authorization token" });

      const decoded = await admin.auth().verifyIdToken(token);
      if (decoded.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const uid = req.body?.uid || req.params?.uid || req.query?.uid;
      if (!uid) {
        return res.status(400).json({ error: "uid is required" });
      }

      await admin.auth().deleteUser(uid).catch((error) => {
        console.log(`Failed to delete user from Auth: ${error.message}`);
      });

      await db.collection("users").doc(uid).delete().catch((error) => {
        console.log(`Failed to delete user document: ${error.message}`);
      });

      res.status(200).json({ 
        success: true,
        message: "User deleted successfully",
        uid: uid
      });

    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ 
        error: "Internal server error",
        details: error.message 
      });
    }
  });
});

exports.setUserRole = functions.https.onCall(async (data, context) => {
  assertRole(context, "admin");
  const { uid, role } = data || {};
  const r = normalizeRole(role, "user");
  await admin.auth().setCustomUserClaims(uid, { role: r });
  await admin.auth().revokeRefreshTokens(uid);
  await db.collection("users").doc(uid).set(
    { role: r, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
  return { ok: true, role: r };
});

/** ---------- ENHANCED: Notifications / Facts ---------- **/
exports.broadcastFactNotification = functions.https.onCall(async (data, context) => {
  try {
    console.log('broadcastFactNotification called with data:', data);
    console.log('User context:', context.auth?.uid, 'Role:', context.auth?.token?.role);
    
    // Elevated role check with Firestore fallback
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required");
    }
    const tokenRole = context.auth.token?.role;
    if (!["admin", "trainer"].includes(tokenRole)) {
      try {
        const userDoc = await db.collection("users").doc(context.auth.uid).get();
        const userRole = String(userDoc.data()?.role || "").toLowerCase();
        if (!["admin", "trainer"].includes(userRole)) {
          throw new functions.https.HttpsError("permission-denied", "Admin or trainer role required");
        }
      } catch (e) {
        if (e instanceof functions.https.HttpsError) throw e;
        throw new functions.https.HttpsError("permission-denied", "Admin or trainer role required");
      }
    }
    
    const factId = String(data?.factId || "");
    const title = String(data?.title || "");
    const message = String(data?.message || "");
    const targetType = String(data?.targetType || "all");
    const roles = (data?.roles || []).map((r) => normalizeRole(r));
    const userIdsInput = (data?.userIds || []).map((s) => String(s));

    if (!title || !message) {
      throw new functions.https.HttpsError("invalid-argument", "title and message are required");
    }

    let targets = [];
    if (targetType === "all") {
      const snap = await db.collection("users").get();
      targets = snap.docs.map((d) => d.id);
    } else if (targetType === "roles") {
      targets = await getUserIdsByRoles(roles);
    } else if (targetType === "users") {
      targets = userIdsInput;
    } else {
      throw new functions.https.HttpsError("invalid-argument", "invalid targetType");
    }
    
    console.log(`Found ${targets.length} target users for notification`);
    
    if (!targets.length) return { count: 0 };

    const docs = targets.map((uid) => ({
      ref: db.collection("notifications").doc(),
      data: {
        userId: uid,
        type: "fact",
        factId: factId || null,
        title,
        message,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      },
    }));
    
    await batchWrite(docs);
    console.log(`Successfully created ${targets.length} notifications`);
    
    return { count: targets.length };
    
  } catch (error) {
    console.error('Error in broadcastFactNotification:', error);
    throw error; 
  }
});

exports.broadcastFactNotificationHttp = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ message: "Missing token" });

      const decoded = await admin.auth().verifyIdToken(token);
      if (!["admin", "trainer"].includes(decoded.role)) {
        return res.status(403).json({ message: "Admin or trainer role required" });
      }

      const { factId = "", title = "", message = "", targetType = "all", roles = [], userIds = [] } =
        req.body || {};
      if (!title || !message) return res.status(400).json({ message: "title and message required" });

      let targets = [];
      if (targetType === "all") {
        const snap = await db.collection("users").get();
        targets = snap.docs.map((d) => d.id);
      } else if (targetType === "roles") {
        targets = await getUserIdsByRoles(roles.map((r) => normalizeRole(r)));
      } else if (targetType === "users") {
        targets = (userIds || []).map(String);
      } else {
        return res.status(400).json({ message: "invalid targetType" });
      }
      if (!targets.length) return res.status(200).json({ count: 0 });

      const docs = targets.map((uid) => ({
        ref: db.collection("notifications").doc(),
        data: {
          userId: uid,
          type: "fact",
          factId: factId || null,
          title,
          message,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        },
      }));
      await batchWrite(docs);
      res.status(200).json({ count: targets.length });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message });
    }
  });
});

/** ---------- NEW: Policy Notifications ---------- **/
exports.broadcastPolicyNotification = functions.https.onCall(async (data, context) => {
  try {
    console.log('broadcastPolicyNotification called with data:', data);
    
    assertRole(context, "admin");
    const policyId = String(data?.policyId || "");
    const title = String(data?.title || "");
    const roles = (data?.roles || []).map((r) => normalizeRole(r));
    
    if (!policyId || !title || roles.length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "policyId, title, and roles are required");
    }
    
    const userIds = await getUserIdsByRoles(roles);
    console.log(`Found ${userIds.length} users for policy notification`);
    
    if (!userIds.length) return { count: 0 };

    const docs = userIds.map((uid) => ({
      ref: db.collection("notifications").doc(),
      data: {
        userId: uid,
        type: "policy",
        policyId,
        title: `New Policy: ${title}`,
        message: `A new policy "${title}" has been published and requires your acknowledgment.`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      },
    }));
    
    await batchWrite(docs);
    console.log(`Successfully created ${userIds.length} policy notifications`);
    
    return { count: userIds.length };
  } catch (error) {
    console.error('Error in broadcastPolicyNotification:', error);
    throw error;
  }
});

exports.broadcastPolicyNotificationHttp = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ message: "Missing token" });

      const decoded = await admin.auth().verifyIdToken(token);
      if (decoded.role !== "admin") return res.status(403).json({ message: "Admin only" });

      const { policyId = "", title = "", roles = [] } = req.body || {};
      if (!policyId || !title || !roles.length) {
        return res.status(400).json({ message: "policyId, title, roles required" });
      }
      const userIds = await getUserIdsByRoles(roles.map((r) => normalizeRole(r)));
      if (!userIds.length) return res.status(200).json({ count: 0 });

      const docs = userIds.map((uid) => ({
        ref: db.collection("notifications").doc(),
        data: {
          userId: uid,
          type: "policy",
          policyId,
          title: `New Policy: ${title}`,
          message: `A new policy "${title}" has been published and requires your acknowledgment.`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        },
      }));
      await batchWrite(docs);
      res.status(200).json({ count: userIds.length });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message });
    }
  });
});

/** ---------- NEW: Quiz Notifications ---------- **/
exports.broadcastQuizNotification = functions.https.onCall(async (data, context) => {
  try {
    console.log('broadcastQuizNotification called with data:', data);
    
    assertElevatedRole(context);
    
    const quizId = String(data?.quizId || "");
    const quizTitle = String(data?.quizTitle || "");
    const message = String(data?.message || "");
    const targetType = String(data?.targetType || "roles");
    const roles = (data?.roles || []).map((r) => normalizeRole(r));
    const userIdsInput = (data?.userIds || []).map((s) => String(s));

    if (!quizId || !quizTitle) {
      throw new functions.https.HttpsError("invalid-argument", "quizId and quizTitle are required");
    }

    let targets = [];
    if (targetType === "all") {
      const snap = await db.collection("users").get();
      targets = snap.docs.map((d) => d.id);
    } else if (targetType === "roles") {
      targets = await getUserIdsByRoles(roles);
    } else if (targetType === "users") {
      targets = userIdsInput;
    } else {
      throw new functions.https.HttpsError("invalid-argument", "invalid targetType");
    }
    
    console.log(`Found ${targets.length} target users for quiz notification`);
    
    if (!targets.length) return { count: 0 };

    const docs = targets.map((uid) => ({
      ref: db.collection("notifications").doc(),
      data: {
        userId: uid,
        type: "quiz",
        quizId: quizId,
        title: `Quiz Assignment: ${quizTitle}`,
        message: message || `You have been assigned a new quiz: ${quizTitle}. Please complete it by the due date.`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      },
    }));
    
    await batchWrite(docs);
    console.log(`Successfully created ${targets.length} quiz notifications`);
    
    return { count: targets.length };
    
  } catch (error) {
    console.error('Error in broadcastQuizNotification:', error);
    throw error;
  }
});

/** ---------- Quiz Analytics ---------- **/
exports.getQuizAnalytics = functions.https.onCall(async (data, context) => {
  try {
    assertElevatedRole(context);
    
    const quizId = String(data?.quizId || "");
    if (!quizId) {
      throw new functions.https.HttpsError("invalid-argument", "quizId is required");
    }

    // Get quiz details
    const quizDoc = await db.collection("quizzes").doc(quizId).get();
    if (!quizDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Quiz not found");
    }

    // Get all results for this quiz
    const resultsSnap = await db.collection("quiz_results")
      .where("quizId", "==", quizId)
      .get();

    const results = resultsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate analytics
    const totalAttempts = results.length;
    const totalQuestions = quizDoc.data().questions?.length || 0;
    
    let totalScore = 0;
    let passedCount = 0;
    const scoreDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    
    results.forEach(result => {
      const score = result.score || 0;
      totalScore += score;
      
      const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
      if (percentage >= 80) {
        scoreDistribution.excellent++;
        passedCount++;
      } else if (percentage >= 70) {
        scoreDistribution.good++;
        passedCount++;
      } else if (percentage >= 60) {
        scoreDistribution.fair++;
        passedCount++;
      } else {
        scoreDistribution.poor++;
      }
    });

    const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
    const averagePercentage = totalQuestions > 0 ? (averageScore / totalQuestions) * 100 : 0;
    const passRate = totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0;

    return {
      quizTitle: quizDoc.data().title,
      totalQuestions,
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      scoreDistribution,
      results: results.sort((a, b) => (b.score || 0) - (a.score || 0))
    };
  } catch (error) {
    console.error('Error in getQuizAnalytics:', error);
    throw error;
  }
});

/** ---------- User Progress Tracking ---------- **/
exports.getUserProgress = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required");
    }

    const userId = context.auth.uid;
    const userRole = context.auth.token?.role;

    const assignmentsSnap = await db.collection("quiz_assignments")
      .where("roles", "array-contains", userRole)
      .get();

    const resultsSnap = await db.collection("quiz_results")
      .where("userId", "==", userId)
      .get();

    const assignments = assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const results = resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const completedQuizIds = new Set(results.map(r => r.quizId));
    const assignedQuizIds = new Set(assignments.map(a => a.quizId));
    
    const totalAssigned = assignedQuizIds.size;
    const totalCompleted = completedQuizIds.size;
    const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

    const now = new Date();
    const overdueAssignments = assignments.filter(assignment => {
      if (!assignment.dueDate) return false;
      const dueDate = assignment.dueDate.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate);
      return dueDate < now && !completedQuizIds.has(assignment.quizId);
    });

    return {
      totalAssigned,
      totalCompleted,
      completionRate: Math.round(completionRate * 100) / 100,
      pendingQuizzes: totalAssigned - totalCompleted,
      overdueCount: overdueAssignments.length,
      recentResults: results
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 5)
    };
  } catch (error) {
    console.error('Error in getUserProgress:', error);
    throw error;
  }
});

/** ---------- Notification Management ---------- **/
exports.markNotificationRead = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required");
    }

    const notificationId = String(data?.notificationId || "");
    if (!notificationId) {
      throw new functions.https.HttpsError("invalid-argument", "notificationId is required");
    }

    const notifRef = db.collection("notifications").doc(notificationId);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Notification not found");
    }

    if (notifDoc.data().userId !== context.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Not your notification");
    }

    await notifRef.update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error in markNotificationRead:', error);
    throw error;
  }
});

exports.markAllNotificationsRead = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required");
    }

    const userId = context.auth.uid;
    const notificationsSnap = await db.collection("notifications")
      .where("userId", "==", userId)
      .where("read", "==", false)
      .get();

    if (notificationsSnap.empty) {
      return { count: 0 };
    }

    const batch = db.batch();
    notificationsSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    return { count: notificationsSnap.size };
  } catch (error) {
    console.error('Error in markAllNotificationsRead:', error);
    throw error;
  }
});

/** ---------- Other Functions ---------- **/
exports.publishFact = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    try {
      const auth = req.headers["authorization"] || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ message: "Missing token" });
      const decoded = await admin.auth().verifyIdToken(token);
      const role = decoded.role;
      if (!["admin", "security"].includes(role)) return res.status(403).json({ message: "Forbidden" });

      const body = req.body || {};
      const message = String(body.message || "");
      const roles = (body.roles || ["security"]).map((r) => normalizeRole(r, "security"));
      const priority = String(body.priority || "normal");
      const type = String(body.type || "security");
      if (!message) return res.status(400).json({ message: "message required" });

      const doc = await db.collection("facts").add({
        message,
        roles,
        priority,
        type,
        createdBy: decoded.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        viewCount: 0,
      });
      res.status(201).json({ id: doc.id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message });
    }
  });
});

exports.completeRegistration = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required after signup");
  }
  const employeeId = String(data?.employeeId || "");
  const firstName = String(data?.firstName || "");
  const lastName = String(data?.lastName || "");
  if (!employeeId || !firstName || !lastName) {
    throw new functions.https.HttpsError("invalid-argument", "employeeId, firstName, lastName are required");
  }
  const snap = await db.collection("employees").doc(employeeId).get();
  if (!snap.exists) throw new functions.https.HttpsError("not-found", "Employee ID not found");

  const emp = snap.data() || {};
  const role = normalizeRole(emp.role, "user");
  await admin.auth().setCustomUserClaims(context.auth.uid, { role });

  await db.collection("users").doc(context.auth.uid).set(
    {
      uid: context.auth.uid,
      email: context.auth.token?.email || null,
      firstName,
      lastName,
      role,
      employeeId,
      linkedEmployeeDoc: snap.ref.path,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await snap.ref.set({ uid: context.auth.uid }, { merge: true });
  return { ok: true, role };
});

/** ---------- MFA Email OTP Endpoints ---------- **/

exports.requestEmailOtp = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ error: "email required" });

     
      const code = generateOtpCode();
      const codeHash = sha256(code);
      const now = admin.firestore.Timestamp.now();
      const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 60 * 1000);

      const docRef = db.collection(OTP_COLLECTION).doc(email);
      await docRef.set({
        email,
        codeHash,
        createdAt: now,
        expiresAt,
        attempts: 0,
      });

      await sendOtpEmail(email, code);
      return res.status(200).json({ ok: true, ttlSeconds: 60 });
    } catch (e) {
      console.error("requestEmailOtp error", e);
      return res.status(500).json({ error: "internal" });
    }
  });
});

// Verify OTP: body { email, code, remember (bool) }
exports.verifyEmailOtp = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      const email = String(req.body?.email || "").trim().toLowerCase();
      const code = String(req.body?.code || "").trim();
      const remember = Boolean(req.body?.remember);
      if (!email || !code) return res.status(400).json({ error: "email and code required" });

      const docRef = db.collection(OTP_COLLECTION).doc(email);
      const snap = await docRef.get();
      if (!snap.exists) return res.status(400).json({ error: "invalid_or_expired" });
      const data = snap.data() || {};

      const nowMs = Date.now();
      const expiresMs = data.expiresAt?.toMillis?.() ? data.expiresAt.toMillis() : 0;
      if (!expiresMs || nowMs > expiresMs) {
        await docRef.delete().catch(() => {});
        return res.status(400).json({ error: "expired" });
      }
      if (sha256(code) !== data.codeHash) {
        await docRef.update({ attempts: (data.attempts || 0) + 1 }).catch(() => {});
        return res.status(400).json({ error: "invalid" });
      }

      await docRef.delete().catch(() => {});

      let rememberToken = null;
      let rememberExpiresAt = null;
      if (remember) {
        rememberToken = crypto.randomUUID();
        const oneDayMs = 24 * 60 * 60 * 1000;
        rememberExpiresAt = admin.firestore.Timestamp.fromMillis(nowMs + oneDayMs);
        await db.collection(REMEMBER_COLLECTION).doc(email).set({
          email,
          tokenHash: sha256(rememberToken),
          createdAt: admin.firestore.Timestamp.now(),
          expiresAt: rememberExpiresAt,
        });
      }

      return res.status(200).json({ ok: true, rememberToken, rememberExpiresAt: rememberExpiresAt?.toMillis?.() || null });
    } catch (e) {
      console.error("verifyEmailOtp error", e);
      return res.status(500).json({ error: "internal" });
    }
  });
});

// Check remember token: body { email, token }
exports.checkRememberOtp = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      const email = String(req.body?.email || "").trim().toLowerCase();
      const token = String(req.body?.token || "");
      if (!email || !token) return res.status(400).json({ error: "email and token required" });
      const ref = db.collection(REMEMBER_COLLECTION).doc(email);
      const snap = await ref.get();
      if (!snap.exists) return res.status(200).json({ ok: true, valid: false });
      const data = snap.data() || {};
      const nowMs = Date.now();
      const expiresMs = data.expiresAt?.toMillis?.() ? data.expiresAt.toMillis() : 0;
      const valid = sha256(token) === data.tokenHash && expiresMs && nowMs < expiresMs;
      if (!valid) {
        await ref.delete().catch(() => {});
      }
      return res.status(200).json({ ok: true, valid });
    } catch (e) {
      console.error("checkRememberOtp error", e);
      return res.status(500).json({ error: "internal" });
    }
  });
});
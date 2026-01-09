import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, sendVerificationEmail, callCompleteRegistration } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Use the shared Firestore instance configured in ../firebase (respects emulator/prod and auth context)

// Default password policy (fallback if settings can't be loaded)
const DEFAULT_PASSWORD_POLICY = {
  minLength: 6,
  requireNumbers: false,
  requireSymbols: false,
  requireUppercase: false,
};

/**
 * Validates employee data against the employees collection
 */
async function validateEmployee(employeeId, email) {
  try {
    // Create a new Firestore instance without authentication context
    const employeeDocRef = doc(db, "employees", employeeId.trim());
    
    // Use a more robust approach with better error handling
    const employeeDoc = await getDoc(employeeDocRef).catch(error => {
      console.error("Error fetching employee document:", error);
      throw new Error("Unable to verify employee information. Please check your employee ID.");
    });
    
    if (!employeeDoc.exists()) {
      return {
        isValid: false,
        error: "Employee ID not found. Please check your employee ID or contact HR."
      };
    }
    
    const employeeData = employeeDoc.data();
    
    // Check if employee is active
    if (employeeData.isActive === false) {
      return {
        isValid: false,
        error: "This employee account is inactive. Please contact HR."
      };
    }
    
    // Validate email matches (case insensitive)
    const employeeEmail = employeeData.email?.toLowerCase();
    const inputEmail = email?.toLowerCase();
    
    if (!employeeEmail || !inputEmail || employeeEmail !== inputEmail) {
      return {
        isValid: false,
        error: "Email does not match our records for this employee ID."
      };
    }
    
    // Check if user already exists with this employee ID
    try {
      const existingUserQuery = query(
        collection(db, "users"),
        where("employeeId", "==", employeeId.trim())
      );
      const existingUsers = await getDocs(existingUserQuery);
      
      if (!existingUsers.empty) {
        return {
          isValid: false,
          error: "An account already exists for this employee ID."
        };
      }
    } catch (queryError) {
      // If we can't check for existing users, we'll let the registration proceed
      // The user creation will fail later if there's a conflict
      console.warn("Could not check for existing users:", queryError);
    }
    
    return {
      isValid: true,
      employee: {
        employeeId: employeeId.trim(),
        fullName: employeeData.fullName || `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim() || 'Unknown',
        email: employeeData.email,
        role: employeeData.role || 'user',
        department: employeeData.department || 'General',
        team: employeeData.team || 'General'
      }
    };
    
  } catch (error) {
    console.error("Employee validation error:", error);
    
    // Handle specific Firebase errors
    if (error.code === 'permission-denied') {
      return {
        isValid: false,
        error: "Unable to verify employee information due to security restrictions. Please contact IT support."
      };
    }
    
    if (error.code === 'unavailable') {
      return {
        isValid: false,
        error: "Service temporarily unavailable. Please try again in a moment."
      };
    }
    
    return {
      isValid: false,
      error: error.message || "Unable to verify employee information. Please try again."
    };
  }
}

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    employeeId: "",
    first: "",
    last: "",
    email: "",
    password: "",
  });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [passwordPolicy, setPasswordPolicy] = useState(DEFAULT_PASSWORD_POLICY);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [allowedDomains, setAllowedDomains] = useState("");
  const [validatedEmployee, setValidatedEmployee] = useState(null);
  const [validatingEmployee, setValidatingEmployee] = useState(false);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    // Clear password validation errors when password changes
    if (k === "password") {
      validatePassword(v, passwordPolicy);
    }
    // Clear email domain errors when email changes
    if (k === "email") {
      validateEmailDomain(v, allowedDomains);
      // Reset employee validation when email changes
      setValidatedEmployee(null);
    }
    // Reset employee validation when employee ID changes
    if (k === "employeeId") {
      setValidatedEmployee(null);
    }
  };

  // Load password policy and domain restrictions from settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, "app_settings", "system");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const settings = settingsSnap.data();
          if (settings.security?.passwordPolicy) {
            setPasswordPolicy(settings.security.passwordPolicy);
            // Validate current password against new policy
            if (form.password) {
              validatePassword(form.password, settings.security.passwordPolicy);
            }
          }
          if (settings.security?.allowedDomains) {
            setAllowedDomains(settings.security.allowedDomains);
            // Validate current email against domain restrictions
            if (form.email) {
              validateEmailDomain(form.email, settings.security.allowedDomains);
            }
          }
        }
      } catch (error) {
        const msg = (error && error.code) || (error && error.message) || String(error);
        console.debug('Could not load app settings (using defaults):', msg);
      }
    };

    loadSettings();
    
    // Set up interval to periodically check for settings updates
    const intervalId = setInterval(loadSettings, 10000);
    
    return () => clearInterval(intervalId);
  }, [form.password, form.email]); // Add dependencies

  // Auto-validate employee when both employeeId and email are provided
  useEffect(() => {
    const validateEmployeeDebounced = async () => {
      const employeeId = form.employeeId.trim();
      const email = form.email.trim();
      
      if (employeeId && email && !validatingEmployee && !validatedEmployee) {
        setValidatingEmployee(true);
        setErr(""); // Clear any previous errors
        
        try {
          const validation = await validateEmployee(employeeId, email);
          
          if (validation.isValid) {
            setValidatedEmployee(validation.employee);
            // Auto-fill names if they're empty
            if (!form.first && !form.last && validation.employee.fullName) {
              const nameParts = validation.employee.fullName.split(" ");
              const firstName = nameParts[0] || "";
              const lastName = nameParts.slice(1).join(" ") || "";
              setForm(prev => ({
                ...prev,
                first: firstName,
                last: lastName
              }));
            }
          } else {
            setErr(validation.error);
            setValidatedEmployee(null);
          }
        } catch (validationError) {
          console.error("Validation error:", validationError);
          setErr("Unable to validate employee information. Please try again.");
          setValidatedEmployee(null);
        } finally {
          setValidatingEmployee(false);
        }
      }
    };

    const timeoutId = setTimeout(validateEmployeeDebounced, 1000); // Increased debounce time
    return () => clearTimeout(timeoutId);
  }, [form.employeeId, form.email, validatingEmployee, validatedEmployee]);

  // Validate password against policy
  const validatePassword = (password, policy) => {
    const errors = [];
    
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }
    
    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push("Password must contain at least one number (0-9)");
    }
    
    if (policy.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one symbol (!@#$%^&*...)");
    }
    
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter (A-Z)");
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  // Validate email domain
  const validateEmailDomain = (email, allowedDomainsStr) => {
    if (!allowedDomainsStr || !email) return true;
    
    const allowedDomains = allowedDomainsStr.split(',').map(d => d.trim().toLowerCase());
    const emailDomain = email.split('@')[1]?.toLowerCase();
    
    if (emailDomain && !allowedDomains.includes(emailDomain)) {
      setErr(`Email domain not allowed. Allowed domains: ${allowedDomains.join(', ')}`);
      return false;
    }
    
    // Clear domain-related errors if validation passes
    if (err && err.includes("Email domain not allowed")) {
      setErr("");
    }
    return true;
  };

  const submit = async (e) => {
    e?.preventDefault();
    setErr("");
    setOk("");
    setBusy(true);
    
    try {
      const employeeId = String(form.employeeId || "").trim();
      if (!employeeId) throw new Error("Employee ID is required.");

      // Validate employee data first
      if (!validatedEmployee) {
        const validation = await validateEmployee(employeeId, form.email.trim());
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
        setValidatedEmployee(validation.employee);
      }

      // Validate password against current policy
      if (!validatePassword(form.password, passwordPolicy)) {
        throw new Error("Password does not meet security requirements.");
      }

      // Validate email domain
      if (!validateEmailDomain(form.email.trim(), allowedDomains)) {
        throw new Error("Email domain is not allowed.");
      }

      // 1) Create auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      // Ensure fresh ID token is available for Firestore security rules
      try { await cred.user.getIdToken(true); } catch {}

      // Role will be assigned by backend trigger from employees directory; client does not set role

      // 3) Finalize registration on server (sets role from employees by employeeId)
      try {
        await callCompleteRegistration({
          employeeId,
          firstName: form.first.trim(),
          lastName: form.last.trim(),
        });
        try { await cred.user.getIdToken(true); } catch {}
      } catch (e) {
        console.error('completeRegistration error (continuing with profile merge):', e);
      }

      // 3b) No client write to users/{uid}. The backend trigger + completeRegistration
      // will create and populate the user document including role.

      // 4) Update Firebase Auth profile
      await updateProfile(cred.user, {
        displayName: `${form.first} ${form.last}`.trim(),
      });
      
      // 5) Send email verification
      try {
        await sendVerificationEmail(cred.user);
        setOk("Account created successfully! Please check your email and verify your account before logging in.");
        // Don't redirect to dashboard - user needs to verify email first
        setTimeout(() => nav("/login", { replace: true }), 3000);
      } catch (verificationError) {
        console.error("Failed to send verification email:", verificationError);
        setOk("Account created successfully! Please check your email and verify your account before logging in.");
        setTimeout(() => nav("/login", { replace: true }), 3000);
      }
    } catch (ex) {
      console.error("Registration error:", ex);
      setErr(ex?.message || "Could not create account.");
    } finally {
      setBusy(false);
    }
  };

  // Check if form is ready for submission
  const isFormValid = () => {
    return (
      form.employeeId.trim() &&
      form.first.trim() &&
      form.last.trim() &&
      form.email.trim() &&
      form.password &&
      validatedEmployee &&
      passwordErrors.length === 0 &&
      !validatingEmployee
    );
  };

  return (
    <>
      <style>{`
        :root{
          --bg-1:#0b1020; --bg-2:#0e1326; --ink-1:#e5e7eb; --ink-2:#c7c9d1; --ink-dim:#9aa0ab;
          --primary:#7c8cff; --primary-2:#9a7cff; --surface:#0f152b; --surface-2:#141b34; --border:#24304f;
          --success:#22c55e; --danger:#ef4444; --warning:#f59e0b; --shadow:0 10px 30px rgba(0,0,0,.35);
        }

        .screen {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          align-items: stretch;
          background:
            radial-gradient(1200px 600px at -10% -10%, #1e2a5a 0%, transparent 60%),
            radial-gradient(1000px 600px at 110% 110%, #442a6b 0%, transparent 60%),
            linear-gradient(180deg, var(--bg-1), var(--bg-2));
          color: var(--ink-1);
        }

        .welcome {
          position: relative;
          display: flex; flex-direction: column;
          justify-content: flex-start; align-items: flex-start;
          padding: 12% 4rem 2.5rem;
          overflow: hidden;
        }
        .welcome-inner { width: 100%; max-width: 720px; position: relative; z-index: 2; }
        .glow {
          position: absolute; inset: -20%;
          background:
            radial-gradient(600px 300px at 30% 20%, rgba(124,140,255,.18), transparent 60%),
            radial-gradient(500px 280px at 70% 80%, rgba(154,124,255,.16), transparent 60%);
          filter: blur(10px); z-index: 1;
        }
        .logo-badge{display:inline-flex;gap:.6rem;align-items:center;padding:.6rem .85rem;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:999px;backdrop-filter:saturate(140%) blur(4px);font-weight:600;letter-spacing:.2px;}
        .logo-dot{width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,var(--primary),var(--primary-2));box-shadow:0 8px 22px rgba(124,140,255,.35);display:inline-block;}
        .title{margin:1rem 0 .4rem;font-size:clamp(28px,3.3vw,44px);line-height:1.1;font-weight:800;}
        .subtitle{margin:0 0 1rem;color:var(--ink-2);font-size:clamp(14px,1.3vw,17px);max-width:52ch;}
        .bullets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem 1rem;margin:1rem 0 1.25rem;}
        .bullet{display:flex;gap:.65rem;align-items:flex-start;color:var(--ink-2);}
        .bullet i{margin-top:.2rem;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:rgba(124,140,255,.15);border:1px solid rgba(124,140,255,.25);}
        .action-row{display:flex;gap:.75rem;flex-wrap:wrap;}
        .btn-ghost{display:inline-flex;align-items:center;gap:.5rem;color:var(--ink-1);text-decoration:none;padding:.7rem 1rem;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);transition:.2s ease;}
        .btn-ghost:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.22);}

        .panel{
          position: relative;
          display:flex; flex-direction:column; justify-content:center;
          padding: 2.5rem 3rem;
          background:
            radial-gradient(600px 120px at 50% 0%, rgba(124,140,255,.15), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.00));
          border-left: 1px solid rgba(255,255,255,.05);
          overflow-y: auto;
        }
        .card{width:100%;max-width:520px;background:linear-gradient(180deg,var(--surface),var(--surface-2));border:1px solid var(--border);border-radius:20px;box-shadow:var(--shadow);padding:2rem;}

        .brand{display:flex;align-items:center;justify-content:center;gap:.6rem;margin-bottom:.75rem;}
        .brand .glyph{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,var(--primary),var(--primary-2));box-shadow:0 10px 26px rgba(124,140,255,.35);font-weight:800;}
        .brand span{color:var(--ink-2);font-weight:600;letter-spacing:.3px;}

        .head{text-align:center;margin-bottom:1rem;}
        .head h2{margin:.25rem 0 .35rem;font-weight:800;color:#fff;}
        .muted{color:var(--ink-dim);font-size:.95rem;}

        .form-group{margin-bottom:1rem;}
        .form-group.has-validation{margin-bottom:.5rem;}
        label{display:block;margin:0 0 .45rem;color:var(--ink-2);font-weight:600;}
        .input{width:100%;color:var(--ink-1);background:#0e142a;border:1px solid var(--border);border-radius:12px;padding:.9rem 1rem;transition:.2s ease;}
        .input:focus{outline:none;border-color:rgba(124,140,255,.65);box-shadow:0 0 0 4px rgba(124,140,255,.15);}
        .input.invalid{border-color:var(--danger);box-shadow:0 0 0 4px rgba(239,68,68,.15);}
        .input.valid{border-color:var(--success);box-shadow:0 0 0 4px rgba(34,197,94,.15);}

        .pw-wrap{position:relative;}
        .toggle{position:absolute;right:.5rem;top:50%;transform:translateY(-50%);border:0;background:transparent;color:var(--ink-dim);cursor:pointer;padding:.35rem .5rem;border-radius:8px;}
        .toggle:hover{color:var(--ink-1);background:rgba(255,255,255,.05);}

        .password-requirements{margin-top:.5rem;padding:.75rem;background:rgba(0,0,0,.2);border:1px solid var(--border);border-radius:8px;}
        .requirement{display:flex;align-items:center;gap:.5rem;font-size:.85rem;margin-bottom:.3rem;}
        .requirement:last-child{margin-bottom:0;}
        .requirement.valid{color:var(--success);}
        .requirement.invalid{color:var(--danger);}
        .requirement.neutral{color:var(--ink-dim);}
        .requirement-icon{width:14px;height:14px;display:flex;align-items:center;justify-content:center;}

        .employee-status{margin-top:.5rem;padding:.75rem;border-radius:8px;font-size:.85rem;}
        .employee-status.validating{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:#fde68a;}
        .employee-status.valid{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#bbf7d0;}
        .employee-status.invalid{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#fecaca;}

        .alert{display:flex;gap:.7rem;align-items:flex-start;border-radius:12px;padding:.85rem .9rem;margin:.25rem 0 1rem;}
        .alert-danger{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.35);color:#fecaca;}
        .alert-success{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.35);color:#bbf7d0;}
        .alert-warning{background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.35);color:#fde68a;}

        .btn{width:100%;border:0;cursor:pointer;border-radius:12px;padding:.95rem 1rem;font-weight:700;background:linear-gradient(135deg,var(--primary),var(--primary-2));color:white;transition:.2s ease;display:flex;align-items:center;justify-content:center;gap:.6rem;}
        .btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 12px 28px rgba(124,140,255,.35);}
        .btn:disabled{opacity:.7;cursor:not-allowed;transform:none;box-shadow:none;}

        .outline{display:inline-flex;gap:.6rem;align-items:center;justify-content:center;margin-top:.6rem;width:100%;border:1px solid var(--border);background:transparent;color:var(--ink-1);padding:.9rem 1rem;border-radius:12px;text-decoration:none;font-weight:700;}
        .outline:hover{border-color:rgba(124,140,255,.6);background:rgba(124,140,255,.06);}

        .split{display:flex;align-items:center;gap:.75rem;margin:1rem 0;color:var(--ink-dim);}
        .split hr{flex:1;border:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent);}

        .back-home{background:transparent;border:0;color:var(--ink-2);text-decoration:underline;cursor:pointer;margin-top:.9rem;}
        .link{color:var(--primary-2);text-decoration:none;}
        .link:hover{text-decoration:underline;}

        @media (max-width: 992px){
          .screen{grid-template-columns:1fr;}
          .welcome{order:2;padding:1.5rem 1.25rem 2rem;}
          .panel{order:1;padding:1.5rem 1.25rem;}
          .bullets{grid-template-columns:1fr;}
        }
      `}</style>

      <main className="screen">
        {/* Left: Welcome/info */}
        <section className="welcome">
          <div className="glow" aria-hidden="true" />
          <div className="welcome-inner">
            <span className="logo-badge">
              <span className="logo-dot" />
              SecureMind
            </span>
            <h1 className="title">Create your SecureMind account</h1>
            <p className="subtitle">
              Enter your Employee ID and work email. We'll auto-assign your role from the
              Employees directory so you get the right training from day one.
            </p>

            <div className="bullets">
              <div className="bullet"><i>✓</i><div><strong>Role-aware setup</strong><div className="muted">Your dashboard is tailored on first sign-in.</div></div></div>
              <div className="bullet"><i>✓</i><div><strong>Email verification</strong><div className="muted">Secure your account and recover access easily.</div></div></div>
              <div className="bullet"><i>✓</i><div><strong>Fast onboarding</strong><div className="muted">Quizzes, modules, and policies ready to go.</div></div></div>
              <div className="bullet"><i>✓</i><div><strong>Privacy by design</strong><div className="muted">Minimal data, encrypted in transit and at rest.</div></div></div>
            </div>
          </div>
        </section>

        {/* Right: Register card */}
        <aside className="panel">
          <div className="card" role="dialog" aria-label="Create SecureMind account">
            <div className="brand">
              <div className="glyph"><img src="/src/img/Logo/SecureMind.png" alt="SecureMind" style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 12 }} /></div>
              <span>SecureMind Portal</span>
            </div>
            <div className="head">
              <h2>Create account</h2>
              <div className="muted">Enter your Employee ID to auto-assign role</div>
            </div>

            <form onSubmit={submit} noValidate>
              <div className="form-group">
                <label htmlFor="emp">Employee ID</label>
                <input
                  id="emp"
                  className={`input ${validatedEmployee ? 'valid' : ''}`}
                  value={form.employeeId}
                  onChange={(e) => set("employeeId", e.target.value)}
                  required
                />
                <div className="muted" style={{ marginTop: 6 }}>
                  We'll fetch your role from the Employees database.
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Work email</label>
                <input
                  id="email"
                  type="email"
                  className={`input ${validatedEmployee ? 'valid' : ''}`}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                />
                {allowedDomains && (
                  <div className="muted" style={{ marginTop: 6 }}>
                    Allowed domains: {allowedDomains.split(',').map(d => d.trim()).join(', ')}
                  </div>
                )}
                
                {/* Employee validation status */}
                {validatingEmployee && (
                  <div className="employee-status validating">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      Validating employee information...
                    </div>
                  </div>
                )}
                
                {validatedEmployee && (
                  <div className="employee-status valid">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      Employee verified
                    </div>
                    <div><strong>Name:</strong> {validatedEmployee.fullName}</div>
                    <div><strong>Role:</strong> {validatedEmployee.role}</div>
                    <div><strong>Department:</strong> {validatedEmployee.department}</div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="first">First name</label>
                <input
                  id="first"
                  className="input"
                  value={form.first}
                  onChange={(e) => set("first", e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="last">Last name</label>
                <input
                  id="last"
                  className="input"
                  value={form.last}
                  onChange={(e) => set("last", e.target.value)}
                  required
                />
              </div>

              <div className="form-group has-validation">
                <label htmlFor="password">Password</label>
                <div className="pw-wrap">
                  <input
                    id="password"
                    type={show ? "text" : "password"}
                    className={`input ${passwordErrors.length > 0 ? 'invalid' : ''}`}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder={`At least ${passwordPolicy.minLength} characters`}
                    minLength={passwordPolicy.minLength}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
                
                {/* Password requirements */}
                <div className="password-requirements">
                  <div className="muted" style={{ marginBottom: '.5rem', fontWeight: 600 }}>
                    Password Requirements:
                  </div>
                  
                  <div className={`requirement ${form.password.length >= passwordPolicy.minLength ? 'valid' : form.password ? 'invalid' : 'neutral'}`}>
                    <div className="requirement-icon">
                      {form.password.length >= passwordPolicy.minLength ? '✓' : form.password ? '✗' : '•'}
                    </div>
                    <div>At least {passwordPolicy.minLength} characters</div>
                  </div>
                  
                  {passwordPolicy.requireNumbers && (
                    <div className={`requirement ${/\d/.test(form.password) ? 'valid' : form.password ? 'invalid' : 'neutral'}`}>
                      <div className="requirement-icon">
                        {/\d/.test(form.password) ? '✓' : form.password ? '✗' : '•'}
                      </div>
                      <div>At least one number (0-9)</div>
                    </div>
                  )}
                  
                  {passwordPolicy.requireSymbols && (
                    <div className={`requirement ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) ? 'valid' : form.password ? 'invalid' : 'neutral'}`}>
                      <div className="requirement-icon">
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) ? '✓' : form.password ? '✗' : '•'}
                      </div>
                      <div>At least one symbol (!@#$%^&*...)</div>
                    </div>
                  )}
                  
                  {passwordPolicy.requireUppercase && (
                    <div className={`requirement ${/[A-Z]/.test(form.password) ? 'valid' : form.password ? 'invalid' : 'neutral'}`}>
                      <div className="requirement-icon">
                        {/[A-Z]/.test(form.password) ? '✓' : form.password ? '✗' : '•'}
                      </div>
                      <div>At least one uppercase letter (A-Z)</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              {err && (
                <div className="alert alert-danger" role="alert">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
                  </svg>
                  <div style={{ marginLeft: 6 }}>
                    <strong>Couldn't create account</strong>
                    <div className="muted" style={{ marginTop: 4 }}>{err}</div>
                  </div>
                </div>
              )}
              {ok && (
                <div className="alert alert-success" role="status">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                  <div style={{ marginLeft: 6 }}>{ok}</div>
                </div>
              )}

              <button 
                className="btn" 
                disabled={busy || !isFormValid()} 
                type="submit"
              >
                {busy ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    Creating…
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    Create account
                  </>
                )}
              </button>

              <div className="split" aria-hidden="true">
                <hr /><span>Already have an account?</span><hr />
              </div>

              <Link to="/login" className="outline">Back to Login</Link>
            </form>

            <div style={{ textAlign: "center" }}>
              <button onClick={() => nav("/")} className="back-home">← Back to Home</button>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}
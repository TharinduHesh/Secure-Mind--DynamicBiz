import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, resetAction } from "../firebase";
import { sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

export default function Forgot() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const oobCode = params.get("oobCode");
  const mode = params.get("mode"); // "resetPassword"
  const resetMode = !!(oobCode && mode === "resetPassword");

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  // If opening with a code, pre-validate it to surface friendlier errors and
  // optionally capture the email on the code for resend flows
  const [codeEmail, setCodeEmail] = useState("");
  useEffect(() => {
    (async () => {
      if (!resetMode) return;
      try {
        const emailFromCode = await verifyPasswordResetCode(auth, oobCode);
        setCodeEmail(emailFromCode || "");
      } catch (ex) {
        const msg = ex?.code === 'auth/expired-action-code'
          ? 'This reset link has expired. You can request a new one.'
          : ex?.code === 'auth/invalid-action-code'
            ? 'This reset link is invalid or already used.'
            : (ex?.message || 'Invalid reset link.');
        setErr(msg);
      }
    })();
  }, [resetMode, oobCode]);

  const send = async (e) => {
    e?.preventDefault();
    setErr(""); setOk(""); setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim(), resetAction);
      setOk("If that email exists, a reset link was sent.");
    } catch (ex) {
      if (ex?.code === 'auth/invalid-email') setErr('Please enter a valid email address.');
      else setErr(ex?.message || "Unable to send reset email.");
    } finally { setBusy(false); }
  };

  const confirm = async (e) => {
    e?.preventDefault();
    setErr(""); setOk(""); setBusy(true);
    if (pwd !== pwd2 || pwd.length < 8) return setErr("Passwords must match and be at least 8 characters.");
    try {
      // (optional) check code valid before confirm for nicer errors
      await verifyPasswordResetCode(auth, oobCode);
      await confirmPasswordReset(auth, oobCode, pwd);
      setOk("Password updated. Redirecting…");
      setTimeout(()=>nav("/login"), 800);
    } catch (ex) {
      const msg = ex?.code === 'auth/expired-action-code'
        ? 'This reset link has expired. Request a new one below.'
        : ex?.code === 'auth/invalid-action-code'
          ? 'This reset link is invalid or already used.'
          : (ex?.message || 'Could not update password.');
      setErr(msg);
    } finally { setBusy(false); }
  };

  return (
    <>
      <style>{`
        :root{
          --bg-1:#0b1020; --bg-2:#0e1326; --ink-1:#e5e7eb; --ink-2:#c7c9d1; --ink-dim:#9aa0ab;
          --primary:#7c8cff; --primary-2:#9a7cff; --surface:#0f152b; --surface-2:#141b34; --border:#24304f;
          --success:#22c55e; --danger:#ef4444; --warning:#f59e0b; --shadow:0 10px 30px rgba(0,0,0,.35);
        }
        .screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:
          radial-gradient(1200px 600px at -10% -10%, #1e2a5a 0%, transparent 60%),
          radial-gradient(1000px 600px at 110% 110%, #442a6b 0%, transparent 60%),
          linear-gradient(180deg, var(--bg-1), var(--bg-2));color:var(--ink-1);padding:2rem;}
        .card{width:100%;max-width:460px;background:linear-gradient(180deg,var(--surface),var(--surface-2));border:1px solid var(--border);border-radius:20px;box-shadow:var(--shadow);padding:2rem;}
        .title{text-align:center;margin:0 0 .3rem;font-weight:800;color:#fff;}
        .muted{text-align:center;color:var(--ink-dim);margin-bottom:1rem;}
        .form-label{color:var(--ink-2);font-weight:600;margin-bottom:.35rem;}
        .input{width:100%;color:var(--ink-1);background:#0e142a;border:1px solid var(--border);border-radius:12px;padding:.9rem 1rem;}
        .btn{width:100%;border:0;cursor:pointer;border-radius:12px;padding:.95rem 1rem;font-weight:700;background:linear-gradient(135deg,var(--primary),var(--primary-2));color:white;transition:.2s ease;display:flex;align-items:center;justify-content:center;gap:.6rem;}
        .btn:disabled{opacity:.7;cursor:not-allowed;}
        .outline{display:inline-flex;gap:.6rem;align-items:center;justify-content:center;margin-top:.75rem;width:100%;border:1px solid var(--border);background:transparent;color:var(--ink-1);padding:.9rem 1rem;border-radius:12px;text-decoration:none;font-weight:700;}
        .alert{border-radius:12px;padding:.85rem .9rem;margin:.25rem 0 1rem;}
        .alert-danger{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.35);color:#fecaca;}
        .alert-success{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.35);color:#bbf7d0;}
      `}</style>

      <main className="screen">
        <div className="card" role="dialog" aria-label="Reset password">
          <h1 className="title">{resetMode ? "Set a new password" : "Forgot your password?"}</h1>
          <p className="muted">{resetMode ? "Choose a new password." : "Enter your email to receive a reset link."}</p>

          {err && <div className="alert alert-danger" role="alert">{err}</div>}
          {ok && <div className="alert alert-success" role="status">{ok}</div>}

          {!resetMode ? (
            <form onSubmit={send} className="vstack gap-3">
              <div>
                <label className="form-label">Email</label>
                <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus />
              </div>
              <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
              <button type="button" className="outline" onClick={()=>nav('/login')}>Back to Login</button>
            </form>
          ) : (
            <form onSubmit={confirm} className="vstack gap-3">
              <div>
                <label className="form-label">New password</label>
                <input className="input" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} minLength={8} required autoFocus />
              </div>
              <div>
                <label className="form-label">Confirm new password</label>
                <input className="input" type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} minLength={8} required />
              </div>
              <button className="btn" disabled={busy || pwd !== pwd2 || pwd.length < 8}>{busy ? 'Updating…' : 'Update password'}</button>
              {err && codeEmail && (
                <button type="button" className="outline"
                        onClick={async()=>{ setOk(""); setErr(""); setBusy(true); try { await sendPasswordResetEmail(auth, codeEmail, resetAction); setOk("A new reset link was sent to "+codeEmail+"."); } catch(e){ setErr(e?.message||"Unable to resend link."); } finally { setBusy(false); } }}>
                  Resend reset link to {codeEmail}
                </button>
              )}
              <button type="button" className="outline" onClick={()=>nav('/login')}>Back to Login</button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
